create or replace function license_admin(op text, payload jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result jsonb;
begin
  case op

  -- ── READS ──
  when 'get_licenses' then
    select coalesce(jsonb_agg(row_to_json(l)::jsonb order by l.created_at desc), '[]')
    into v_result from licenses l;
    return v_result;

  when 'get_requests' then
    select coalesce(jsonb_agg(row_to_json(r)::jsonb order by r.created_at desc), '[]')
    into v_result from license_requests r;
    return v_result;

  when 'get_transfers' then
    select coalesce(jsonb_agg(
      (row_to_json(t)::jsonb) || jsonb_build_object(
        'licenses', case when l.id is not null then row_to_json(l)::jsonb else null end
      ) order by t.created_at desc
    ), '[]')
    into v_result
    from license_transfers t
    left join licenses l on l.id = t.license_id;
    return v_result;

  when 'get_events' then
    select coalesce(jsonb_agg(row_to_json(e)::jsonb order by e.created_at desc), '[]')
    into v_result
    from license_events e
    where e.license_id = (payload->>'license_id')::uuid;
    return v_result;

  -- ── LICENSE WRITES ──
  when 'insert_license' then
    insert into licenses (
      tier, billing_cycle, status,
      holder_org, holder_contact, holder_email, holder_phone, holder_domain,
      agency_name, department, num_districts, program_description, launch_date,
      is_owner_held, monthly_rate, annual_rate, notes, activated_at
    ) values (
      payload->>'tier',
      coalesce(payload->>'billing_cycle', 'monthly'),
      coalesce(payload->>'status', 'active'),
      payload->>'holder_org',
      coalesce(payload->>'holder_contact', payload->>'holder_org'),
      payload->>'holder_email',
      payload->>'holder_phone',
      payload->>'holder_domain',
      payload->>'agency_name',
      payload->>'department',
      payload->>'num_districts',
      payload->>'program_description',
      nullif(payload->>'launch_date','')::date,
      coalesce((payload->>'is_owner_held')::boolean, false),
      nullif(payload->>'monthly_rate','')::numeric,
      nullif(payload->>'annual_rate','')::numeric,
      payload->>'notes',
      now()
    )
    returning row_to_json(licenses)::jsonb into v_result;
    return v_result;

  when 'update_license' then
    update licenses set
      status           = coalesce(payload->>'status', status),
      holder_org       = coalesce(payload->>'holder_org', holder_org),
      holder_contact   = coalesce(payload->>'holder_contact', holder_contact),
      holder_email     = coalesce(payload->>'holder_email', holder_email),
      is_owner_held    = coalesce((payload->>'is_owner_held')::boolean, is_owner_held),
      activated_at     = coalesce(nullif(payload->>'activated_at','')::timestamptz, activated_at)
    where id = (payload->>'id')::uuid
    returning row_to_json(licenses)::jsonb into v_result;
    return v_result;

  -- ── REQUEST WRITES ──
  when 'update_request' then
    update license_requests set
      status               = coalesce(payload->>'status', status),
      admin_notes          = coalesce(payload->>'admin_notes', admin_notes),
      converted_license_id = coalesce(nullif(payload->>'converted_license_id','')::uuid, converted_license_id)
    where id = (payload->>'id')::uuid
    returning row_to_json(license_requests)::jsonb into v_result;
    return v_result;

  -- ── TRANSFER WRITES ──
  when 'insert_transfer' then
    insert into license_transfers (
      license_id, from_org, from_email, to_org, to_email,
      to_contact, to_phone, transfer_reason,
      owner_authorized, owner_authorized_at, status, admin_notes
    ) values (
      nullif(payload->>'license_id','')::uuid,
      payload->>'from_org', payload->>'from_email',
      payload->>'to_org',   payload->>'to_email',
      payload->>'to_contact', payload->>'to_phone',
      payload->>'transfer_reason',
      coalesce((payload->>'owner_authorized')::boolean, false),
      nullif(payload->>'owner_authorized_at','')::timestamptz,
      coalesce(payload->>'status', 'pending'),
      payload->>'admin_notes'
    )
    returning row_to_json(license_transfers)::jsonb into v_result;
    return v_result;

  when 'update_transfer' then
    update license_transfers set
      status              = coalesce(payload->>'status', status),
      owner_authorized    = coalesce((payload->>'owner_authorized')::boolean, owner_authorized),
      owner_authorized_at = coalesce(nullif(payload->>'owner_authorized_at','')::timestamptz, owner_authorized_at),
      completed_at        = coalesce(nullif(payload->>'completed_at','')::timestamptz, completed_at),
      admin_notes         = coalesce(payload->>'admin_notes', admin_notes)
    where id = (payload->>'id')::uuid
    returning row_to_json(license_transfers)::jsonb into v_result;
    return v_result;

  -- ── EVENT WRITE ──
  when 'insert_event' then
    insert into license_events (license_id, event_type, description, performed_by, metadata)
    values (
      (payload->>'license_id')::uuid,
      payload->>'event_type',
      payload->>'description',
      coalesce(payload->>'performed_by', 'ks@evobrand.net'),
      nullif(payload->>'metadata','')::jsonb
    );
    return '{"ok":true}'::jsonb;

  else
    raise exception 'Unknown operation: %', op;
  end case;
end;
$$;

grant execute on function license_admin(text, jsonb) to anon;
