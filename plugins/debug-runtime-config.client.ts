import { useRuntimeConfig } from '#app';

export default defineNuxtPlugin((nuxtApp) => {
  // Utilise useRuntimeConfig pour accéder à la configuration
  const config = useRuntimeConfig();

  console.log('--- DEBUG [Plugin Client] ---');
  // Logue l'intégralité de la configuration publique
  console.log('runtimeConfig.public:', JSON.stringify(config.public, null, 2));

  // Vérifie spécifiquement la présence de la configuration Supabase attendue
  if (config.public.supabase) {
    console.log('runtimeConfig.public.supabase EXISTS.');
    console.log('runtimeConfig.public.supabase.url:', config.public.supabase.url);
    console.log('runtimeConfig.public.supabase.key exists:', !!config.public.supabase.key);
  } else {
    console.log('runtimeConfig.public.supabase DOES NOT EXIST.');
  }
  console.log('-----------------------------');

  // Tu peux aussi logger nuxtApp.$config.public qui est la même chose
  // console.log('nuxtApp.$config.public:', JSON.stringify(nuxtApp.$config.public, null, 2));
});