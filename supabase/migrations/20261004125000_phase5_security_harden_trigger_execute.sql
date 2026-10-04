-- Phase 5 security hardening: this function is trigger-only and must not be callable through the Data API.
revoke execute on function public.ensure_public_user_rows() from public, anon, authenticated;
