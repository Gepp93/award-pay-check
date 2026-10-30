CREATE TABLE public.employer_enquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  business_name text NOT NULL,
  contact_name text NOT NULL,
  work_email text NOT NULL,
  phone text,
  industry text NOT NULL,
  employee_count text NOT NULL,
  service text NOT NULL,
  message text NOT NULL,
  consent boolean NOT NULL,
  sender_hash text NOT NULL,
  notified_at timestamptz
);
GRANT ALL ON public.employer_enquiries TO service_role;
ALTER TABLE public.employer_enquiries ENABLE ROW LEVEL SECURITY;
CREATE INDEX employer_enquiries_sender_idx ON public.employer_enquiries (sender_hash, created_at DESC);