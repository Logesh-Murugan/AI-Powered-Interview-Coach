/**
 * Admin Dashboard Page
 * System metrics and user management for admin users
 */

import React, { useEffect, useState } from 'react';
import {
    Container,
    Box,
    Typography,
    Paper,
    Grid,
    Card,
    CardContent,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    TableContainer,
    TablePagination,
    Chip,
    Button,
    TextField,
    Select,
    MenuItem,
    Alert,
    IconButton,
    Stack,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    CircularProgress,
} from '@mui/material';
import {
    People,
    Assessment,
    Quiz,
    SmartToy,
    Refresh,
    Search,
    Block,
    CheckCircle,
    Delete,
} from '@mui/icons-material';
import apiService from '../../services/api.service';
import LoadingSpinner from '../../components/common/LoadingSpinner';

interface SystemMetrics {
    users: {
        total: number;
        active: number;
        new_today: number;
        new_this_week: number;
        new_this_month: number;
    };
    interviews: {
        total_sessions: number;
        completed_sessions: number;
        completion_rate: number;
        sessions_today: number;
        sessions_this_week: number;
    };
    evaluations: {
        total: number;
        average_score: number;
    };
    questions: {
        total_in_database: number;
    };
    ai_providers: Array<{
        name: string;
        model: string;
        priority: number;
        quota_limit: number;
    }>;
    generated_at: string;
}

interface AdminUser {
    id: number;
    email: string;
    name: string;
    target_role: string | null;
    account_status: string;
    created_at: string | null;
    last_login_at: string | null;
    current_streak: number;
    total_achievements: number;
}

const AdminDashboardPage: React.FC = () => {
    const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [totalUsers, setTotalUsers] = useState(0);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [deleteDialog, setDeleteDialog] = useState<AdminUser | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const loadMetrics = async () => {
        try {
            const res = await apiService.get('/admin/metrics');
            setMetrics(res.data as SystemMetrics);
        } catch (err: any) {
            console.error('Failed to load metrics:', err);
        }
    };

    const loadUsers = async (pageNum = 0) => {
        try {
            const params: any = { page: pageNum + 1, per_page: 10 };
            if (search) params.search = search;
            if (statusFilter) params.status_filter = statusFilter;

            const res = await apiService.get('/admin/users', { params });
            const data = res.data as any;
            setUsers(data.users);
            setTotalUsers(data.total);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to load users');
        }
    };

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await Promise.all([loadMetrics(), loadUsers()]);
            setLoading(false);
        };
        init();
    }, []);

    useEffect(() => {
        loadUsers(page);
    }, [page, search, statusFilter]);

    const handleStatusChange = async (userId: number, newStatus: string) => {
        setActionLoading(true);
        try {
            await apiService.patch(`/admin/users/${userId}/status?new_status=${newStatus}`);
            loadUsers(page);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to update user status');
        }
        setActionLoading(false);
    };

    const handleDelete = async () => {
        if (!deleteDialog) return;
        setActionLoading(true);
        try {
            await apiService.delete(`/admin/users/${deleteDialog.id}`);
            setDeleteDialog(null);
            loadUsers(page);
            loadMetrics();
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Failed to delete user');
        }
        setActionLoading(false);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'success';
            case 'suspended': return 'error';
            case 'locked': return 'warning';
            case 'pending_verification': return 'info';
            default: return 'default';
        }
    };

    if (loading) {
        return (
            <Container maxWidth="xl" sx={{ mt: 4 }}>
                <LoadingSpinner variant="fullPage" size="large" text="Loading admin dashboard..." />
            </Container>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            {/* Header */}
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold">Admin Dashboard</Typography>
                    <Typography variant="body2" color="text.secondary">
                        System metrics & user management
                    </Typography>
                </Box>
                <Button
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={() => { loadMetrics(); loadUsers(page); }}
                >
                    Refresh
                </Button>
            </Box>

            {error && (
                <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* System Metrics Cards */}
            {metrics && (
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                            <CardContent>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Box>
                                        <Typography variant="h3" fontWeight="bold">{metrics.users.total}</Typography>
                                        <Typography variant="body2" sx={{ opacity: 0.8 }}>Total Users</Typography>
                                        <Typography variant="caption" sx={{ opacity: 0.7 }}>
                                            +{metrics.users.new_this_week} this week
                                        </Typography>
                                    </Box>
                                    <People sx={{ fontSize: 48, opacity: 0.3 }} />
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                            <CardContent>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Box>
                                        <Typography variant="h3" fontWeight="bold">{metrics.interviews.total_sessions}</Typography>
                                        <Typography variant="body2" sx={{ opacity: 0.8 }}>Total Interviews</Typography>
                                        <Typography variant="caption" sx={{ opacity: 0.7 }}>
                                            {metrics.interviews.completion_rate}% completion rate
                                        </Typography>
                                    </Box>
                                    <Assessment sx={{ fontSize: 48, opacity: 0.3 }} />
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
                            <CardContent>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Box>
                                        <Typography variant="h3" fontWeight="bold">{metrics.questions.total_in_database}</Typography>
                                        <Typography variant="body2" sx={{ opacity: 0.8 }}>Questions in DB</Typography>
                                        <Typography variant="caption" sx={{ opacity: 0.7 }}>
                                            Avg score: {metrics.evaluations.average_score}%
                                        </Typography>
                                    </Box>
                                    <Quiz sx={{ fontSize: 48, opacity: 0.3 }} />
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <Card sx={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
                            <CardContent>
                                <Stack direction="row" justifyContent="space-between" alignItems="center">
                                    <Box>
                                        <Typography variant="h3" fontWeight="bold">{metrics.ai_providers.length}</Typography>
                                        <Typography variant="body2" sx={{ opacity: 0.8 }}>AI Providers</Typography>
                                        <Typography variant="caption" sx={{ opacity: 0.7 }}>
                                            {metrics.ai_providers[0]?.model || 'N/A'}
                                        </Typography>
                                    </Box>
                                    <SmartToy sx={{ fontSize: 48, opacity: 0.3 }} />
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {/* AI Provider Details */}
            {metrics && metrics.ai_providers.length > 0 && (
                <Paper sx={{ p: 3, mb: 4 }}>
                    <Typography variant="h6" gutterBottom>AI Providers</Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                        {metrics.ai_providers.map((p) => (
                            <Grid size={{ xs: 12, sm: 4 }} key={p.name}>
                                <Card variant="outlined">
                                    <CardContent>
                                        <Typography variant="subtitle1" fontWeight="bold">{p.name}</Typography>
                                        <Typography variant="body2" color="text.secondary">Model: {p.model}</Typography>
                                        <Typography variant="body2" color="text.secondary">Quota: {p.quota_limit}/day</Typography>
                                        <Chip label={`Priority ${p.priority}`} size="small" color="primary" sx={{ mt: 1 }} />
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Paper>
            )}

            {/* User Management */}
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>User Management</Typography>
                <Divider sx={{ mb: 2 }} />

                {/* Filters */}
                <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
                    <TextField
                        size="small"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                        InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }}
                        sx={{ minWidth: 300 }}
                    />
                    <Select
                        size="small"
                        value={statusFilter}
                        onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                        displayEmpty
                        sx={{ minWidth: 180 }}
                    >
                        <MenuItem value="">All Statuses</MenuItem>
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="suspended">Suspended</MenuItem>
                        <MenuItem value="locked">Locked</MenuItem>
                        <MenuItem value="pending_verification">Pending</MenuItem>
                    </Select>
                </Stack>

                {/* Users Table */}
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Name</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Role</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell>Streak</TableCell>
                                <TableCell>Joined</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id} hover>
                                    <TableCell>{user.id}</TableCell>
                                    <TableCell>{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{user.target_role || '—'}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={user.account_status}
                                            color={getStatusColor(user.account_status) as any}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>{user.current_streak}🔥</TableCell>
                                    <TableCell>
                                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                                    </TableCell>
                                    <TableCell align="right">
                                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                            {user.account_status === 'active' ? (
                                                <IconButton
                                                    size="small"
                                                    color="warning"
                                                    title="Suspend"
                                                    onClick={() => handleStatusChange(user.id, 'suspended')}
                                                    disabled={actionLoading}
                                                >
                                                    <Block fontSize="small" />
                                                </IconButton>
                                            ) : (
                                                <IconButton
                                                    size="small"
                                                    color="success"
                                                    title="Activate"
                                                    onClick={() => handleStatusChange(user.id, 'active')}
                                                    disabled={actionLoading}
                                                >
                                                    <CheckCircle fontSize="small" />
                                                </IconButton>
                                            )}
                                            <IconButton
                                                size="small"
                                                color="error"
                                                title="Delete"
                                                onClick={() => setDeleteDialog(user)}
                                                disabled={actionLoading}
                                            >
                                                <Delete fontSize="small" />
                                            </IconButton>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {users.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                                        <Typography color="text.secondary">No users found</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination
                    component="div"
                    count={totalUsers}
                    page={page}
                    onPageChange={(_, p) => setPage(p)}
                    rowsPerPage={10}
                    rowsPerPageOptions={[10]}
                />
            </Paper>

            {/* Delete Confirmation */}
            <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)}>
                <DialogTitle>Delete User?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to permanently delete <strong>{deleteDialog?.name}</strong> ({deleteDialog?.email})?
                        This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog(null)}>Cancel</Button>
                    <Button onClick={handleDelete} color="error" disabled={actionLoading}>
                        {actionLoading ? <CircularProgress size={20} /> : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default AdminDashboardPage;
