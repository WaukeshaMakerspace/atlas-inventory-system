'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Box,
  CircularProgress,
} from '@mui/material';
import { useTagsByCategory } from '@/hooks/useTags';
import type { Location, Tag } from '@/types';

interface LocationFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: LocationFormData) => void;
  locations: (Location & { locationTypeTag?: Tag })[];
  editingLocation?: (Location & { locationTypeTag?: Tag }) | null;
  loading?: boolean;
  error?: string | null;
}

export interface LocationFormData {
  name: string;
  locationTypeTagId: string;
  description?: string;
  parentId?: string;
}

export default function LocationForm({
  open,
  onClose,
  onSubmit,
  locations,
  editingLocation,
  loading,
  error,
}: LocationFormProps) {
  const { data: locationTypeTags, isLoading: tagsLoading } = useTagsByCategory('Location Type');

  const [formData, setFormData] = useState<LocationFormData>({
    name: '',
    locationTypeTagId: '',
    description: '',
    parentId: '',
  });

  // Populate form when editing or opening
  useEffect(() => {
    if (!open) return;

    if (editingLocation) {
      setFormData({
        name: editingLocation.name,
        locationTypeTagId: editingLocation.locationTypeTagId || '',
        description: editingLocation.description || '',
        parentId: editingLocation.parentId || '',
      });
    } else {
      // Set default to first location type tag for new locations
      setFormData({
        name: '',
        locationTypeTagId: locationTypeTags?.[0]?.id || '',
        description: '',
        parentId: '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingLocation, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      parentId: formData.parentId || undefined,
      description: formData.description || undefined,
    });
  };

  const handleClose = () => {
    setFormData({
      name: '',
      locationTypeTagId: '',
      description: '',
      parentId: '',
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {editingLocation ? 'Edit Location' : 'Add New Location'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              fullWidth
              autoFocus
            />

            <FormControl fullWidth required>
              <InputLabel>Type</InputLabel>
              <Select
                value={formData.locationTypeTagId}
                label="Type"
                disabled={tagsLoading}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    locationTypeTagId: e.target.value,
                  })
                }
              >
                {tagsLoading ? (
                  <MenuItem disabled>Loading...</MenuItem>
                ) : (
                  locationTypeTags?.map((tag) => (
                    <MenuItem key={tag.id} value={tag.id}>
                      {tag.name}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Parent Location</InputLabel>
              <Select
                value={formData.parentId}
                label="Parent Location"
                onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
              >
                <MenuItem value="">
                  <em>None (Top Level)</em>
                </MenuItem>
                {locations
                  .filter((loc) => loc.id !== editingLocation?.id)
                  .map((location) => (
                    <MenuItem key={location.id} value={location.id}>
                      {location.path}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Saving...' : editingLocation ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
