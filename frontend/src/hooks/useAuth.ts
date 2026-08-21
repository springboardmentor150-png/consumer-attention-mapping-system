import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../store";
import { loginThunk, registerThunk, logoutThunk } from "../store/slices/authSlice";
import { LoginRequest, RegisterRequest } from "../types";

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated, isLoading, error } = useSelector(
    (state: RootState) => state.auth
  );

  const login = useCallback(
    async (credentials: LoginRequest) => {
      const result = await dispatch(loginThunk(credentials));
      if (loginThunk.rejected.match(result)) {
        throw new Error(result.payload as string);
      }
      return result.payload;
    },
    [dispatch]
  );

  const register = useCallback(
    async (details: RegisterRequest) => {
      const result = await dispatch(registerThunk(details));
      if (registerThunk.rejected.match(result)) {
        throw new Error(result.payload as string);
      }
      return result.payload;
    },
    [dispatch]
  );

  const logout = useCallback(() => {
    dispatch(logoutThunk());
  }, [dispatch]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
  };
};
