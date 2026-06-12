import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/sonner";
import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";
import { StyledEngineProvider } from "@mui/material/styles";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const muiTheme = createTheme({
  palette: {
    primary: { main: "#0F7E86" },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: "'IBM Plex Sans Thai', sans-serif",
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <QueryClientProvider client={queryClient}>
          <Toaster />
          <App />
        </QueryClientProvider>
      </ThemeProvider>
    </StyledEngineProvider>
  </StrictMode>,
);
