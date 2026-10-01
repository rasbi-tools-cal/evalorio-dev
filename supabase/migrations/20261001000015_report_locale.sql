-- Language of the person who reported a listing, so the decision notice (DSA Art. 16(5)) reaches them in it.
alter table public.reports add column locale text not null default 'en' check (locale in ('en', 'es', 'fr', 'it', 'pt'));
