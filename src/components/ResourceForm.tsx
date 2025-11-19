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
  Autocomplete,
  Typography,
} from '@mui/material';
import { useLocations, useCreateLocation } from '@/hooks/useLocations';
import { useTagsByCategory } from '@/hooks/useTags';
import { useResourceModels, useCreateResourceModel } from '@/hooks/useResourceModels';
import type { ResourceWithLocation, Tag } from '@/types';

const CREATE_NEW_MODEL = 'CREATE_NEW_MODEL';
const CREATE_NEW_LOCATION = 'CREATE_NEW_LOCATION';

interface ResourceFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ResourceFormData) => void;
  editingResource?: ResourceWithLocation | null;
  loading?: boolean;
  error?: string | null;
}

export interface ResourceFormData {
  modelId?: string;
  serialNumber?: string | null;
  locationId: string;
  tagIds: string[];
}

interface ResourceFormState {
  modelId: string;
  serialNumber: string;
  locationId: string;
  statusTagId: string;
  conditionTagId: string;
  // New model fields (when creating a new model)
  newModelName: string;
  newModelManufacturer: string;
  newModelDescription: string;
  newModelNumber: string;
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
  const { data: statusTags, isLoading: statusTagsLoading } = useTagsByCategory('Status');
  const { data: conditionTags, isLoading: conditionTagsLoading } = useTagsByCategory('Condition');
  const { data: resourceModels, isLoading: modelsLoading } = useResourceModels();
  const { data: locationTypeTags, isLoading: locationTypeTagsLoading } = useTagsByCategory('Location Type');
  const createModelMutation = useCreateResourceModel();
  const createLocationMutation = useCreateLocation();

  const [formData, setFormData] = useState<ResourceFormState>({
    modelId: '',
    serialNumber: '',
    locationId: '',
    statusTagId: '',
    conditionTagId: '',
    newModelName: '',
    newModelManufacturer: '',
    newModelDescription: '',
    newModelNumber: '',
  });

  // Track the location selection path for cascading dropdowns
  const [locationPath, setLocationPath] = useState<string[]>([]);

  // Track which level is creating a new location (null means none)
  const [creatingLocationAtLevel, setCreatingLocationAtLevel] = useState<number | null>(null);

  // New location details
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationDescription, setNewLocationDescription] = useState('');
  const [newLocationTypeTagId, setNewLocationTypeTagId] = useState('');

  // Helper function to get locations by parent
  const getLocationsByParent = (parentId: string | null) => {
    return locations?.filter((loc) => loc.parentId === parentId) || [];
  };

  // Helper function to build path from a location ID
  const buildLocationPath = (locationId: string): string[] => {
    if (!locations) return [];
    const path: string[] = [];
    let currentId: string | null = locationId;

    while (currentId) {
      const location = locations.find((l) => l.id === currentId);
      if (!location) break;
      path.unshift(currentId);
      currentId = location.parentId;
    }

    return path;
  };

  // Populate form when editing
  useEffect(() => {
    if (!open) return;

    if (editingResource) {
      const statusTag = editingResource.tags?.find((t) => t.category?.name === 'Status');
      const conditionTag = editingResource.tags?.find((t) => t.category?.name === 'Condition');

      setFormData({
        modelId: editingResource.modelId,
        serialNumber: editingResource.serialNumber || '',
        locationId: editingResource.locationId,
        statusTagId: statusTag?.id || '',
        conditionTagId: conditionTag?.id || '',
      });

      // Build location path for editing
      setLocationPath(buildLocationPath(editingResource.locationId));
    } else {
      const rootLocations = getLocationsByParent(null);
      const firstLocation = rootLocations[0];

      setFormData({
        modelId: resourceModels?.[0]?.id || '',
        serialNumber: '',
        locationId: firstLocation?.id || '',
        statusTagId: '',
        conditionTagId: '',
        newModelName: '',
        newModelManufacturer: '',
        newModelDescription: '',
        newModelNumber: '',
      });

      // Set initial location path
      setLocationPath(firstLocation ? [firstLocation.id] : []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingResource, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const tagIds: string[] = [];
    if (formData.statusTagId) tagIds.push(formData.statusTagId);
    if (formData.conditionTagId) tagIds.push(formData.conditionTagId);

    let modelId = formData.modelId;

    // If creating a new model, create it first
    if (formData.modelId === CREATE_NEW_MODEL) {
      if (!formData.newModelName) {
        return; // Let the required field validation handle this
      }

      try {
        const newModel = await createModelMutation.mutateAsync({
          name: formData.newModelName,
          manufacturer: formData.newModelManufacturer || undefined,
          description: formData.newModelDescription || undefined,
          modelNumber: formData.newModelNumber || undefined,
        });
        modelId = newModel.id;
      } catch (err) {
        // Error will be shown by parent component
        return;
      }
    }

    onSubmit({
      modelId,
      serialNumber: formData.serialNumber || null,
      locationId: formData.locationId,
      tagIds,
    });
  };

  const handleClose = () => {
    setFormData({
      modelId: '',
      serialNumber: '',
      locationId: '',
      statusTagId: '',
      conditionTagId: '',
      newModelName: '',
      newModelManufacturer: '',
      newModelDescription: '',
      newModelNumber: '',
    });
    setLocationPath([]);
    setCreatingLocationAtLevel(null);
    setNewLocationName('');
    setNewLocationDescription('');
    setNewLocationTypeTagId('');
    onClose();
  };

  // Handle location selection at a specific level
  const handleLocationChange = (level: number, locationId: string) => {
    if (locationId === CREATE_NEW_LOCATION) {
      setCreatingLocationAtLevel(level);
      setNewLocationTypeTagId(locationTypeTags?.[0]?.id || '');
      return;
    }

    const newPath = [...locationPath.slice(0, level), locationId];
    setLocationPath(newPath);
    setFormData({
      ...formData,
      locationId,
    });
    setCreatingLocationAtLevel(null);
  };

  // Handle creating a new location at a specific level
  const handleCreateLocation = async (level: number) => {
    if (!newLocationName) return;

    const parentId = level === 0 ? null : locationPath[level - 1];

    try {
      const newLocation = await createLocationMutation.mutateAsync({
        name: newLocationName,
        description: newLocationDescription || undefined,
        locationTypeTagId: newLocationTypeTagId || undefined,
        parentId: parentId || undefined,
      });

      // Add the new location to the path
      const newPath = [...locationPath.slice(0, level), newLocation.id];
      setLocationPath(newPath);
      setFormData({
        ...formData,
        locationId: newLocation.id,
      });

      // Reset new location fields
      setNewLocationName('');
      setNewLocationDescription('');
      setNewLocationTypeTagId('');
      setCreatingLocationAtLevel(null);
    } catch (err) {
      // Error will be shown by parent component or mutation
      console.error('Failed to create location:', err);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {editingResource ? 'Edit Resource' : 'Add Resource'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}

            {editingResource ? (
              <TextField
                label="Resource Model"
                value={editingResource.model?.name || ''}
                disabled
                fullWidth
              />
            ) : (
              <>
                <Autocomplete
                  options={[
                    { id: CREATE_NEW_MODEL, name: '+ Create New Model', manufacturer: null },
                    ...(resourceModels || []),
                  ]}
                  getOptionLabel={(option) =>
                    option.id === CREATE_NEW_MODEL
                      ? option.name
                      : option.manufacturer
                        ? `${option.manufacturer} - ${option.name}`
                        : option.name
                  }
                  value={
                    formData.modelId === CREATE_NEW_MODEL
                      ? { id: CREATE_NEW_MODEL, name: '+ Create New Model', manufacturer: null }
                      : resourceModels?.find((m) => m.id === formData.modelId) || null
                  }
                  onChange={(_, newValue) => {
                    setFormData({
                      ...formData,
                      modelId: newValue?.id || '',
                    });
                  }}
                  loading={modelsLoading}
                  disabled={modelsLoading}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Resource Model"
                      required
                      placeholder="Search or select a model..."
                    />
                  )}
                  renderOption={(props, option) => (
                    <li {...props} key={option.id}>
                      {option.id === CREATE_NEW_MODEL ? (
                        <em style={{ color: '#1976d2' }}>{option.name}</em>
                      ) : (
                        <Box>
                          <Box sx={{ fontWeight: 500 }}>
                            {option.manufacturer ? `${option.manufacturer} - ${option.name}` : option.name}
                          </Box>
                          {option.description && (
                            <Box sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                              {option.description}
                            </Box>
                          )}
                        </Box>
                      )}
                    </li>
                  )}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                />

                {formData.modelId === CREATE_NEW_MODEL && (
                  <>
                    <TextField
                      label="Model Name"
                      value={formData.newModelName}
                      onChange={(e) => setFormData({ ...formData, newModelName: e.target.value })}
                      fullWidth
                      required
                      helperText="e.g., UM2+, Prusa i3 MK3S+"
                    />
                    <TextField
                      label="Manufacturer"
                      value={formData.newModelManufacturer}
                      onChange={(e) => setFormData({ ...formData, newModelManufacturer: e.target.value })}
                      fullWidth
                      helperText="e.g., Ultimaker, Prusa Research"
                    />
                    <TextField
                      label="Model Number"
                      value={formData.newModelNumber}
                      onChange={(e) => setFormData({ ...formData, newModelNumber: e.target.value })}
                      fullWidth
                    />
                    <TextField
                      label="Description"
                      value={formData.newModelDescription}
                      onChange={(e) => setFormData({ ...formData, newModelDescription: e.target.value })}
                      fullWidth
                      multiline
                      rows={3}
                    />
                  </>
                )}
              </>
            )}

            <TextField
              label="Serial Number"
              value={formData.serialNumber || ''}
              onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
              fullWidth
              autoFocus
            />

            {/* Cascading Location Selectors */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {/* Root level dropdown */}
              <FormControl fullWidth required>
                <InputLabel>Location</InputLabel>
                <Select
                  value={creatingLocationAtLevel === 0 ? CREATE_NEW_LOCATION : (locationPath[0] || '')}
                  label="Location"
                  disabled={locationsLoading}
                  onChange={(e) => handleLocationChange(0, e.target.value)}
                >
                  <MenuItem value={CREATE_NEW_LOCATION}>
                    <em style={{ color: '#1976d2' }}>+ Create New Location</em>
                  </MenuItem>
                  {locationsLoading ? (
                    <MenuItem disabled>Loading...</MenuItem>
                  ) : (
                    getLocationsByParent(null).map((location) => (
                      <MenuItem key={location.id} value={location.id}>
                        {location.name}
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>

              {/* Show creation fields for root level */}
              {creatingLocationAtLevel === 0 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pl: 2, borderLeft: '3px solid #1976d2' }}>
                  <TextField
                    label="Location Name"
                    value={newLocationName}
                    onChange={(e) => setNewLocationName(e.target.value)}
                    fullWidth
                    required
                    size="small"
                  />
                  <FormControl fullWidth size="small">
                    <InputLabel>Location Type</InputLabel>
                    <Select
                      value={newLocationTypeTagId}
                      label="Location Type"
                      onChange={(e) => setNewLocationTypeTagId(e.target.value)}
                    >
                      {locationTypeTags?.map((tag) => (
                        <MenuItem key={tag.id} value={tag.id}>
                          {tag.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    label="Description"
                    value={newLocationDescription}
                    onChange={(e) => setNewLocationDescription(e.target.value)}
                    fullWidth
                    multiline
                    rows={2}
                    size="small"
                  />
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleCreateLocation(0)}
                    disabled={!newLocationName || createLocationMutation.isPending}
                  >
                    {createLocationMutation.isPending ? 'Creating...' : 'Create Location'}
                  </Button>
                </Box>
              )}

              {/* Additional levels based on selection */}
              {locationPath.map((selectedId, index) => {
                const children = getLocationsByParent(selectedId);
                const currentLocation = locations?.find((l) => l.id === selectedId);
                const nextLevelId = locationPath[index + 1];
                const isCreatingAtThisLevel = creatingLocationAtLevel === index + 1;

                return (
                  <Box key={`level-${index + 1}`}>
                    <FormControl fullWidth>
                      <InputLabel shrink>{currentLocation?.name} - Sublocation</InputLabel>
                      <Select
                        value={isCreatingAtThisLevel ? CREATE_NEW_LOCATION : (nextLevelId || '')}
                        label={`${currentLocation?.name} - Sublocation`}
                        onChange={(e) => handleLocationChange(index + 1, e.target.value)}
                        displayEmpty
                        notched
                      >
                        <MenuItem value="">
                          <em>Use {currentLocation?.name}</em>
                        </MenuItem>
                        <MenuItem value={CREATE_NEW_LOCATION}>
                          <em style={{ color: '#1976d2' }}>+ Create New Sublocation</em>
                        </MenuItem>
                        {children.map((location) => (
                          <MenuItem key={location.id} value={location.id}>
                            {location.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {/* Show creation fields for this level */}
                    {isCreatingAtThisLevel && (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2, pl: 2, borderLeft: '3px solid #1976d2' }}>
                        <TextField
                          label="Sublocation Name"
                          value={newLocationName}
                          onChange={(e) => setNewLocationName(e.target.value)}
                          fullWidth
                          required
                          size="small"
                        />
                        <FormControl fullWidth size="small">
                          <InputLabel>Location Type</InputLabel>
                          <Select
                            value={newLocationTypeTagId}
                            label="Location Type"
                            onChange={(e) => setNewLocationTypeTagId(e.target.value)}
                          >
                            {locationTypeTags?.map((tag) => (
                              <MenuItem key={tag.id} value={tag.id}>
                                {tag.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <TextField
                          label="Description"
                          value={newLocationDescription}
                          onChange={(e) => setNewLocationDescription(e.target.value)}
                          fullWidth
                          multiline
                          rows={2}
                          size="small"
                        />
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleCreateLocation(index + 1)}
                          disabled={!newLocationName || createLocationMutation.isPending}
                        >
                          {createLocationMutation.isPending ? 'Creating...' : 'Create Sublocation'}
                        </Button>
                      </Box>
                    )}
                  </Box>
                );
              })}

              {/* Show current path */}
              {locationPath.length > 0 && (
                <Box sx={{ px: 2, py: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    Selected Location:
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {locations?.find((l) => l.id === formData.locationId)?.path || ''}
                  </Typography>
                </Box>
              )}
            </Box>

            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={formData.statusTagId}
                label="Status"
                disabled={statusTagsLoading}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    statusTagId: e.target.value,
                  })
                }
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {statusTagsLoading ? (
                  <MenuItem disabled>Loading...</MenuItem>
                ) : (
                  statusTags?.map((tag) => (
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
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Condition</InputLabel>
              <Select
                value={formData.conditionTagId}
                label="Condition"
                disabled={conditionTagsLoading}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    conditionTagId: e.target.value,
                  })
                }
              >
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
                {conditionTagsLoading ? (
                  <MenuItem disabled>Loading...</MenuItem>
                ) : (
                  conditionTags?.map((tag) => (
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
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading || createModelMutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={loading || createModelMutation.isPending}>
            {loading || createModelMutation.isPending ? 'Saving...' : editingResource ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
