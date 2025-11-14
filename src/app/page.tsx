'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  TextField,
  CircularProgress,
  Alert,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ResourceTable from '@/components/ResourceTable';
import { useResources } from '@/hooks/useResources';

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0); // Reset to first page when search changes
    }, 600);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch resources using TanStack Query
  const { data, isLoading, error } = useResources({
    search: debouncedSearch,
    limit: rowsPerPage,
    offset: page * rowsPerPage,
  });

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Resources
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Search and browse all resources in the makerspace
        </Typography>

        <Box sx={{ mt: 4, mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search resources, locations, manufacturers"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ maxWidth: 800 }}
          />
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error instanceof Error ? error.message : 'An error occurred'}
          </Alert>
        )}

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {!isLoading && data && (
          <ResourceTable
            resources={data.resources}
            total={data.total}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        )}
      </Box>
    </Container>
  );
}
