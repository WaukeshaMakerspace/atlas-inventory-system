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
  Button,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useSession } from 'next-auth/react';
import AddIcon from '@mui/icons-material/Add';
import ResourceTable from '@/components/ResourceTable';
import ResourceForm, { type ResourceFormData } from '@/components/ResourceForm';
import { useResources, useUpdateResource, useCreateResource } from '@/hooks/useResources';
import type { ResourceWithLocation, Tag, TagCategory } from '@/types';

export default function Home() {
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [formOpen, setFormOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<(ResourceWithLocation & { tags?: (Tag & { category: TagCategory })[] }) | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const isAuthenticated = !!session;
  const createMutation = useCreateResource();
  const updateMutation = useUpdateResource();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(0); // Reset to first page when search changes
    }, 600);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch resources using TanStack Query
  const { data, isLoading, error, isFetching, isError, status } = useResources({
    search: debouncedSearch,
    limit: rowsPerPage,
    offset: page * rowsPerPage,
  });

  // Debug logging
  console.log('Resources query state:', {
    isLoading,
    isFetching,
    isError,
    status,
    hasData: !!data,
    dataLength: data?.resources?.length,
    error: error?.message,
  });

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleAdd = () => {
    setEditingResource(null);
    setFormError(null);
    setFormOpen(true);
  };

  const handleEdit = (resource: ResourceWithLocation & { tags?: (Tag & { category: TagCategory })[] }) => {
    setEditingResource(resource);
    setFormError(null);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingResource(null);
    setFormError(null);
  };

  const handleSubmit = async (data: ResourceFormData) => {
    try {
      setFormError(null);

      if (editingResource) {
        // Update existing resource
        await updateMutation.mutateAsync({
          id: editingResource.id,
          updates: data,
        });
      } else {
        // Create new resource
        if (!data.modelId) {
          setFormError('Please select a resource model');
          return;
        }
        await createMutation.mutateAsync({
          modelId: data.modelId,
          locationId: data.locationId,
          serialNumber: data.serialNumber,
          tagIds: data.tagIds,
        });
      }

      handleCloseForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : `Failed to ${editingResource ? 'update' : 'create'} resource`);
    }
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

        <Box sx={{ mt: 4, mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
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
          {isAuthenticated && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAdd}
              sx={{ whiteSpace: 'nowrap' }}
            >
              Add Resource
            </Button>
          )}
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
            onEdit={handleEdit}
            isAuthenticated={isAuthenticated}
          />
        )}

        <ResourceForm
          open={formOpen}
          onClose={handleCloseForm}
          onSubmit={handleSubmit}
          editingResource={editingResource}
          loading={createMutation.isPending || updateMutation.isPending}
          error={formError}
        />
      </Box>
    </Container>
  );
}
