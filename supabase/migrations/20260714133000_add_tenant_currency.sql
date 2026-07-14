ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'TRY';

ALTER TABLE public.tenants
DROP CONSTRAINT IF EXISTS tenants_currency_check;

ALTER TABLE public.tenants
ADD CONSTRAINT tenants_currency_check
CHECK (currency IN ('USD', 'EUR', 'GBP', 'TRY'));
