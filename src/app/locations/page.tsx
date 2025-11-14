'use client';

import { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LoginIcon from '@mui/icons-material/Login';
import { useSession, signIn } from 'next-auth/react';
import { useLocations, useCreateLocation, useUpdateLocation } from '@/hooks/useLocations';
import LocationForm, { type LocationFormData } from '@/components/LocationForm';
import type { Location, Tag } from '@/types';

export default function LocationsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [formOpen, setFormOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<(Location & { locationTypeTag?: Tag }) | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: locations, isLoading, error } = useLocations();
  const createMutation = useCreateLocation();
  const updateMutation = useUpdateLocation();

  const isAuthenticated = !!session;

  const handleOpenForm = (location?: Location & { locationTypeTag?: Tag }) => {
    if (location) {
      setEditingLocation(location);
    } else {
      setEditingLocation(null);
    }
    setFormError(null);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingLocation(null);
    setFormError(null);
  };

  const handleSubmit = async (data: LocationFormData) => {
    try {
      setFormError(null);

      if (editingLocation) {
        await updateMutation.mutateAsync({
          id: editingLocation.id,
          updates: data,
        });
      } else {
        await createMutation.mutateAsync(data);
      }

      handleCloseForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save location');
    }
  };

  // Sort locations by path for hierarchical display
  const sortedLocations = locations
    ? [...locations].sort((a, b) => a.path.localeCompare(b.path))
    : [];

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Locations
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenForm()}
            disabled={!isAuthenticated}
          >
            Add Location
          </Button>
        </Box>

        {!isAuthenticated && sessionStatus !== 'loading' && (
          <Alert
            severity="info"
            sx={{ mb: 3 }}
            action={
              <Button
                color="inherit"
                size="small"
                startIcon={<LoginIcon />}
                onClick={() => signIn('wildapricot')}
              >
                Sign in
              </Button>
            }
          >
            Sign in to add or edit locations
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error instanceof Error ? error.message : 'Failed to load locations'}
          </Alert>
        )}

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {!isLoading && locations && (
          <Paper>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <strong>Path</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Name</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Type</strong>
                    </TableCell>
                    <TableCell>
                      <strong>Description</strong>
                    </TableCell>
                    <TableCell align="right">
                      <strong>Actions</strong>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedLocations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                        <Typography color="text.secondary">
                          No locations yet. Click "Add Location" to get started.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedLocations.map((location) => (
                      <TableRow key={location.id} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <LocationOnIcon fontSize="small" color="action" />
                            <Typography variant="body2">{location.path}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body1" fontWeight="medium">
                            {location.name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {location.locationTypeTag ? (
                            <Chip
                              label={location.locationTypeTag.name}
                              size="small"
                              sx={{
                                backgroundColor: location.locationTypeTag.color || '#9c27b0',
                                color: '#fff',
                              }}
                            />
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              -
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {location.description || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenForm(location)}
                            color="primary"
                            disabled={!isAuthenticated}
                          >
                            <EditIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        )}

        <LocationForm
          open={formOpen}
          onClose={handleCloseForm}
          onSubmit={handleSubmit}
          locations={locations || []}
          editingLocation={editingLocation}
          loading={createMutation.isPending || updateMutation.isPending}
          error={formError}
        />
      </Box>
    </Container>
  );
}
