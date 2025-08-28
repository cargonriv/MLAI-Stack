const API_URL = '/api';

export const login = async (email, password) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    throw new Error('Login failed');
  }
  return response.json();
};

export const register = async (email, password) => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) {
    throw new Error('Registration failed');
  }
  return response.json();
};

export const getMovies = async () => {
    const response = await fetch(`${API_URL}/movies`);
    if (!response.ok) {
        throw new Error('Failed to get movies');
    }
    return response.json();
};

export const getRecommendations = async (token) => {
  const response = await fetch(`${API_URL}/recommendations` , {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error('Failed to get recommendations');
  }
  return response.json();
};

export const addRating = async (token, movieId, rating) => {
    const response = await fetch(`${API_URL}/user/ratings`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ movieId, rating }),
    });
    if (!response.ok) {
        throw new Error('Failed to add rating');
    }
    return response.json();
};

export const getProfile = async (token) => {
    const response = await fetch(`${API_URL}/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
        throw new Error('Failed to get profile');
    }
    return response.json();
};
