import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function useSWRSettings() {
  const { data, error, mutate } = useSWR<Record<string, string>>(
    '/api/v1/settings',
    fetcher,
    { revalidateOnFocus: false }
  );

  const updateSettings = async (settings: Record<string, string>) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('xananas_auth_token') : null;
    const res = await fetch('/api/v1/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(settings),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erro ao salvar configurações');
    }

    // Revalidate
    await mutate();
  };

  return {
    settings: data || {},
    isLoading: !error && !data,
    isError: error,
    updateSettings,
  };
}
