CREATE POLICY "admins manage players update" ON public.players FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage players delete" ON public.players FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage videos update" ON public.videos FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage videos delete" ON public.videos FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage academies update" ON public.academies FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage academies delete" ON public.academies FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));