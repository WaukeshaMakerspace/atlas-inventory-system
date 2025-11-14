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
  Typography,
} from '@mui/material';
import { useTagCategories } from '@/hooks/useTags';
import type { Tag, TagCategory } from '@/types';

interface TagFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TagFormData) => void;
  editingTag?: (Tag & { category: TagCategory }) | null;
  loading?: boolean;
  error?: string | null;
}

export interface TagFormData {
  name: string;
  categoryId: string;
  description?: string;
  color?: string;
}

export default function TagForm({
  open,
  onClose,
  onSubmit,
  editingTag,
  loading,
  error,
}: TagFormProps) {
  const { data: categories, isLoading: categoriesLoading } = useTagCategories();

  const [formData, setFormData] = useState<TagFormData>({
    name: '',
    categoryId: '',
    description: '',
    color: '',
  });

  // Populate form when editing
  useEffect(() => {
    if (!open) return;

    if (editingTag) {
      setFormData({
        name: editingTag.name,
        categoryId: editingTag.categoryId,
        description: editingTag.description || '',
        color: editingTag.color || '',
      });
    } else {
      setFormData({
        name: '',
        categoryId: categories?.[0]?.id || '',
        description: '',
        color: '',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingTag, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      description: formData.description || undefined,
      color: formData.color || undefined,
    });
  };

  const handleClose = () => {
    setFormData({
      name: '',
      categoryId: '',
      description: '',
      color: '',
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {editingTag ? 'Edit Tag' : 'Add New Tag'}
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
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.categoryId}
                label="Category"
                disabled={categoriesLoading}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    categoryId: e.target.value,
                  })
                }
              >
                {categoriesLoading ? (
                  <MenuItem disabled>Loading...</MenuItem>
                ) : (
                  categories?.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>

            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Color
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <input
                  type="color"
                  value={formData.color || '#3B82F6'}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  style={{
                    width: 60,
                    height: 40,
                    border: '1px solid #ccc',
                    borderRadius: 4,
                    cursor: 'pointer',
                  }}
                />
                <TextField
                  value={formData.color || ''}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="#3B82F6"
                  size="small"
                  sx={{ flexGrow: 1 }}
                />
              </Box>
            </Box>

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
            {loading ? 'Saving...' : editingTag ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
