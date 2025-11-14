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
  Chip,
  OutlinedInput,
} from '@mui/material';
import { useLocations } from '@/hooks/useLocations';
import { useTags } from '@/hooks/useTags';
import type { ResourceWithLocation, Tag } from '@/types';

interface ResourceFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ResourceFormData) => void;
  editingResource?: ResourceWithLocation | null;
  loading?: boolean;
  error?: string | null;
}

export interface ResourceFormData {
  serialNumber?: string | null;
  locationId: string;
  tagIds: string[];
}

export default function ResourceForm({
  open,
  onClose,
  onSubmit,
  editingResource,
  loading,
  error,
}: ResourceFormProps) {
  const { data: locations, isLoading: locationsLoading } = useLocations();
  const { data: tags, isLoading: tagsLoading } = useTags();

  const [formData, setFormData] = useState<ResourceFormData>({
    serialNumber: '',
    locationId: '',
    tagIds: [],
  });

  // Populate form when editing
  useEffect(() => {
    if (!open) return;

    if (editingResource) {
      setFormData({
        serialNumber: editingResource.serialNumber || '',
        locationId: editingResource.locationId,
        tagIds: editingResource.tags?.map((t) => t.id) || [],
      });
    } else {
      setFormData({
        serialNumber: '',
        locationId: locations?.[0]?.id || '',
        tagIds: [],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingResource, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      serialNumber: formData.serialNumber || null,
    });
  };

  const handleClose = () => {
    setFormData({
      serialNumber: '',
      locationId: '',
      tagIds: [],
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          Edit Resource
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}

            {editingResource && (
              <Box>
                <TextField
                  label="Resource Model"
                  value={editingResource.model?.name || ''}
                  disabled
                  fullWidth
                />
              </Box>
            )}

            <TextField
              label="Serial Number"
              value={formData.serialNumber || ''}
              onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
              fullWidth
              autoFocus
            />

            <FormControl fullWidth required>
              <InputLabel>Location</InputLabel>
              <Select
                value={formData.locationId}
                label="Location"
                disabled={locationsLoading}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    locationId: e.target.value,
                  })
                }
              >
                {locationsLoading ? (
                  <MenuItem disabled>Loading...</MenuItem>
                ) : (
                  locations?.map((location) => (
                    <MenuItem key={location.id} value={location.id}>
                      {location.path}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Tags</InputLabel>
              <Select
                multiple
                value={formData.tagIds}
                label="Tags"
                disabled={tagsLoading}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({
                    ...formData,
                    tagIds: typeof value === 'string' ? value.split(',') : value,
                  });
                }}
                input={<OutlinedInput label="Tags" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((tagId) => {
                      const tag = tags?.find((t) => t.id === tagId);
                      return tag ? (
                        <Chip
                          key={tagId}
                          label={tag.name}
                          size="small"
                          sx={{
                            backgroundColor: tag.color || '#9E9E9E',
                            color: '#fff',
                          }}
                        />
                      ) : null;
                    })}
                  </Box>
                )}
              >
                {tagsLoading ? (
                  <MenuItem disabled>Loading...</MenuItem>
                ) : (
                  tags?.map((tag) => (
                    <MenuItem key={tag.id} value={tag.id}>
                      <Chip
                        label={tag.name}
                        size="small"
                        sx={{
                          backgroundColor: tag.color || '#9E9E9E',
                          color: '#fff',
                          mr: 1,
                        }}
                      />
                      {tag.category.name}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? 'Saving...' : 'Update'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
