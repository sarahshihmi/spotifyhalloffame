const SET_USER = "session/setUser";
const REMOVE_USER = "session/removeUser";

// Action creators
const setUser = (user) => ({
  type: SET_USER,
  payload: user,
});

const removeUser = () => ({
  type: REMOVE_USER,
});

// Thunks

// Handles Spotify login
export const loginSpotifyUser = (token) => async (dispatch) => {
  try {
    // Save token to localStorage
    localStorage.setItem('token', token);

    const response = await fetch('/api/spotify/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error("Failed to fetch Spotify user data");

    const data = await response.json();
    dispatch(setUser(data.user)); // Save user to Redux
  } catch (err) {
    console.error("Error logging in with Spotify:", err);
    throw err;
  }
};

// Restores user session (Spotify-specific)
export const restoreUser = () => async (dispatch) => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.error("No token found in localStorage");
    return null;
  }

  try {
    const response = await fetch('/api/spotify/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error("Failed to restore user session:", await response.text());
      throw new Error("Failed to restore user session");
    }

    const data = await response.json();
    dispatch(setUser(data.user)); // Save user to Redux
    return data.user;
  } catch (err) {
    console.error("Error restoring user session:", err);
    return null;
  }
};


// Logs the user out
export const logout = () => (dispatch) => {
  localStorage.removeItem('token'); // Remove token from localStorage
  dispatch(removeUser());
};

// Initial state
const initialState = { user: null };

// Reducer
const sessionReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_USER:
      return { ...state, user: action.payload };
    case REMOVE_USER:
      return { ...state, user: null };
    default:
      return state;
  }
};

export default sessionReducer;
