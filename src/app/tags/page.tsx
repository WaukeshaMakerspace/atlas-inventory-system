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
import LabelIcon from '@mui/icons-material/Label';
import LoginIcon from '@mui/icons-material/Login';
import { useSession, signIn } from 'next-auth/react';
import { useTags, useCreateTag, useUpdateTag } from '@/hooks/useTags';
import TagForm, { type TagFormData } from '@/components/TagForm';
import type { Tag, TagCategory } from '@/types';

export default function TagsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [formOpen, setFormOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<(Tag & { category: TagCategory }) | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: tags, isLoading, error } = useTags();
  const createMutation = useCreateTag();
  const updateMutation = useUpdateTag();

  const isAuthenticated = !!session;

  const handleOpenForm = (tag?: Tag & { category: TagCategory }) => {
    if (tag) {
      setEditingTag(tag);
    } else {
      setEditingTag(null);
    }
    setFormError(null);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingTag(null);
    setFormError(null);
  };

  const handleSubmit = async (data: TagFormData) => {
    try {
      setFormError(null);

      if (editingTag) {
        await updateMutation.mutateAsync({
          id: editingTag.id,
          updates: data,
        });
      } else {
        await createMutation.mutateAsync(data);
      }

      handleCloseForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save tag');
    }
  };

  // Group tags by category
  const tagsByCategory = tags?.reduce((acc, tag) => {
    const categoryName = tag.category.name;
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(tag);
    return acc;
  }, {} as Record<string, (Tag & { category: TagCategory })[]>);

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Tags
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenForm()}
            disabled={!isAuthenticated}
          >
            Add Tag
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
            Sign in to add or edit tags
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error instanceof Error ? error.message : 'Failed to load tags'}
          </Alert>
        )}

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {!isLoading && tagsByCategory && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {Object.entries(tagsByCategory).map(([categoryName, categoryTags]) => (
              <Paper key={categoryName}>
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Typography variant="h6" fontWeight="medium">
                    {categoryName}
                  </Typography>
                </Box>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <strong>Name</strong>
                        </TableCell>
                        <TableCell>
                          <strong>Preview</strong>
                        </TableCell>
                        <TableCell>
                          <strong>Color</strong>
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
                      {categoryTags.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                            <Typography color="text.secondary">
                              No tags in this category yet.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        categoryTags.map((tag) => (
                          <TableRow key={tag.id} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <LabelIcon fontSize="small" color="action" />
                                <Typography variant="body1" fontWeight="medium">
                                  {tag.name}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={tag.name}
                                size="small"
                                sx={{
                                  backgroundColor: tag.color || '#9E9E9E',
                                  color: '#fff',
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {tag.color && (
                                  <Box
                                    sx={{
                                      width: 24,
                                      height: 24,
                                      borderRadius: 1,
                                      backgroundColor: tag.color,
                                      border: '1px solid #ccc',
                                    }}
                                  />
                                )}
                                <Typography variant="body2" color="text.secondary">
                                  {tag.color || '-'}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {tag.description || '-'}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenForm(tag)}
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
            ))}
          </Box>
        )}

        <TagForm
          open={formOpen}
          onClose={handleCloseForm}
          onSubmit={handleSubmit}
          editingTag={editingTag}
          loading={createMutation.isPending || updateMutation.isPending}
          error={formError}
        />
      </Box>
    </Container>
  );
}
