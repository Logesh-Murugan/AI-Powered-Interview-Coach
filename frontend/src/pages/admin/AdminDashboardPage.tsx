/**
 * Premium Admin Dashboard
 * High-end System Command & User Matrix Control
 */

import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Grid,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    TableContainer,
    TablePagination,
    Chip,
    TextField,
    Select,
    MenuItem,
    IconButton,
    Stack,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    CircularProgress,
    alpha,
    useTheme,
    Button,
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
    Terminal,
    Hub
} from '@mui/icons-material';
import apiService from '../../services/api.service';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import { GlassCard, GradientButton, GradientText } from '../../components/common/PremiumComponents';
import { motion } from 'framer-motion';

const MotionBox = motion.create(Box);

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
    const theme = useTheme();
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
            console.error('Metrics fail:', err);
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
            setError(err.response?.data?.detail || 'USER MATRIX SYNC FAILED');
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
            setError(err.response?.data?.detail || 'STATUS UPDATE FAILED');
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
            setError(err.response?.data?.detail || 'USER DELETION FAILED');
        }
        setActionLoading(false);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return theme.palette.success.main;
            case 'suspended': return theme.palette.error.main;
            case 'locked': return theme.palette.warning.main;
            default: return theme.palette.text.disabled;
        }
    };

    if (loading) return <LoadingSpinner variant="fullPage" size="large" />;

    return (
        <Box sx={{ pb: 8 }}>
            {/* Premium Header */}
            <MotionBox
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                sx={{ mb: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}
            >
                <Box>
                    <Typography variant="h3" sx={{ fontWeight: 900, mb: 1, fontFamily: 'Orbitron' }}>SYSTEM <GradientText>COMMAND</GradientText></Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
                        CORE TELEMETRY AND USER MATRIX MANAGEMENT
                    </Typography>
                </Box>
                <GradientButton
                    variant="outlined"
                    startIcon={<Refresh />}
                    onClick={() => { loadMetrics(); loadUsers(page); }}
                >
                    REFRESH LATTICE
                </GradientButton>
            </MotionBox>

            {error && <ErrorAlert message={error} onDismiss={() => setError(null)} sx={{ mb: 4 }} />}

            {/* System Metrics Matrix */}
            {metrics && (
                <Grid container spacing={3} sx={{ mb: 6 }}>
                    {[
                        { label: 'TOTAL NODES', value: metrics.users.total, icon: <People />, color: theme.palette.primary.main },
                        { label: 'ACTIVE SESSIONS', value: metrics.interviews.total_sessions, icon: <Assessment />, color: theme.palette.secondary.main },
                        { label: 'DATABASE VECTOR', value: metrics.questions.total_in_database, icon: <Quiz />, color: theme.palette.warning.main },
                        { label: 'AI CORES', value: metrics.ai_providers.length, icon: <SmartToy />, color: theme.palette.success.main },
                    ].map((stat, i) => (
                        <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
                            <GlassCard sx={{ p: 3, textAlign: 'center', borderTop: `4px solid ${stat.color}`, height: '100%' }}>
                                <Box sx={{ color: stat.color, mb: 1.5, opacity: 0.5 }}>{stat.icon}</Box>
                                <Typography variant="h3" sx={{ fontWeight: 900, fontFamily: 'Orbitron', color: stat.color }}>{stat.value}</Typography>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.secondary', letterSpacing: '0.1em' }}>{stat.label}</Typography>
                            </GlassCard>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* AI Provider Cluster */}
            {metrics && (
                <GlassCard sx={{ p: 4, mb: 6 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center" mb={3}>
                        <Hub sx={{ color: 'primary.main' }} />
                        <Typography variant="h6" sx={{ fontWeight: 1000, fontFamily: 'Orbitron' }}>AI PROVIDER CLUSTER</Typography>
                    </Stack>
                    <Grid container spacing={3}>
                        {metrics.ai_providers.map((p) => (
                            <Grid size={{ xs: 12, md: 4 }} key={p.name}>
                                <Box sx={{ p: 2, borderRadius: 3, bgcolor: alpha(theme.palette.background.paper, 0.3), border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
                                    <Typography variant="body2" sx={{ fontWeight: 900, mb: 0.5 }}>{p.name.toUpperCase()}</Typography>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 1.5 }}>MODEL: {p.model}</Typography>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                       <Chip label={`PRIORITY ${p.priority}`} size="small" sx={{ fontWeight: 900, height: 18, fontSize: '0.6rem' }} />
                                       <Typography variant="caption" sx={{ fontWeight: 800 }}>QUOTA: {p.quota_limit}/DAY</Typography>
                                    </Stack>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </GlassCard>
            )}

            {/* User Matrix Control */}
            <GlassCard sx={{ p: 0, overflow: 'hidden' }}>
                <Box sx={{ p: 4, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                        <Terminal sx={{ color: 'secondary.main' }} />
                        <Typography variant="h6" sx={{ fontWeight: 1000, fontFamily: 'Orbitron' }}>USER MATRIX CONTROL</Typography>
                    </Stack>
                    <Stack direction="row" spacing={2}>
                        <TextField
                            size="small"
                            placeholder="SEARCH OPERATIVE..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                            InputProps={{ 
                                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary', fontSize: 18 }} />,
                                sx: { borderRadius: 3, fontWeight: 700, fontFamily: 'Orbitron', fontSize: '0.75rem', width: 250 } 
                            }}
                        />
                        <Select
                            size="small"
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                            displayEmpty
                            sx={{ borderRadius: 3, fontWeight: 800, fontFamily: 'Orbitron', fontSize: '0.75rem', minWidth: 150 }}
                        >
                            <MenuItem value="" sx={{ fontWeight: 800 }}>ALL STATUSES</MenuItem>
                            <MenuItem value="active" sx={{ fontWeight: 800 }}>ACTIVE ONLY</MenuItem>
                            <MenuItem value="suspended" sx={{ fontWeight: 800 }}>SUSPENDED</MenuItem>
                            <MenuItem value="locked" sx={{ fontWeight: 800 }}>LOCKED</MenuItem>
                        </Select>
                    </Stack>
                </Box>

                <TableContainer>
                    <Table size="small">
                        <TableHead sx={{ bgcolor: alpha(theme.palette.background.paper, 0.4) }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 900, color: 'text.secondary', border: 'none' }}>ID</TableCell>
                                <TableCell sx={{ fontWeight: 900, color: 'text.secondary', border: 'none' }}>OPERATIVE</TableCell>
                                <TableCell sx={{ fontWeight: 900, color: 'text.secondary', border: 'none' }}>ROLE</TableCell>
                                <TableCell sx={{ fontWeight: 900, color: 'text.secondary', border: 'none' }}>STATUS</TableCell>
                                <TableCell sx={{ fontWeight: 900, color: 'text.secondary', border: 'none' }}>STREAK</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 900, color: 'text.secondary', border: 'none' }}>ACTIONS</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id} hover sx={{ '&:hover': { bgcolor: alpha(theme.palette.background.paper, 0.6) } }}>
                                    <TableCell sx={{ borderBottom: `1px solid ${alpha(theme.palette.divider, 0.03)}`, fontWeight: 800 }}>{user.id}</TableCell>
                                    <TableCell sx={{ borderBottom: `1px solid ${alpha(theme.palette.divider, 0.03)}` }}>
                                        <Box>
                                            <Typography variant="body2" sx={{ fontWeight: 800 }}>{user.name.toUpperCase()}</Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>{user.email}</Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ borderBottom: `1px solid ${alpha(theme.palette.divider, 0.03)}`, fontWeight: 700, fontSize: '0.8rem' }}>{user.target_role?.toUpperCase() || '—'}</TableCell>
                                    <TableCell sx={{ borderBottom: `1px solid ${alpha(theme.palette.divider, 0.03)}` }}>
                                        <Chip
                                            label={user.account_status.toUpperCase()}
                                            sx={{ 
                                                fontWeight: 900, 
                                                fontSize: '0.6rem', 
                                                height: 20, 
                                                bgcolor: alpha(getStatusColor(user.account_status), 0.1), 
                                                color: getStatusColor(user.account_status) 
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ borderBottom: `1px solid ${alpha(theme.palette.divider, 0.03)}`, fontWeight: 900, color: 'warning.main' }}>{user.current_streak}🔥</TableCell>
                                    <TableCell align="right" sx={{ borderBottom: `1px solid ${alpha(theme.palette.divider, 0.03)}` }}>
                                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                            {user.account_status === 'active' ? (
                                                <IconButton
                                                    size="small"
                                                    color="warning"
                                                    onClick={() => handleStatusChange(user.id, 'suspended')}
                                                    disabled={actionLoading}
                                                >
                                                    <Block fontSize="small" />
                                                </IconButton>
                                            ) : (
                                                <IconButton
                                                    size="small"
                                                    color="success"
                                                    onClick={() => handleStatusChange(user.id, 'active')}
                                                    disabled={actionLoading}
                                                >
                                                    <CheckCircle fontSize="small" />
                                                </IconButton>
                                            )}
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => setDeleteDialog(user)}
                                                disabled={actionLoading}
                                            >
                                                <Delete fontSize="small" />
                                            </IconButton>
                                        </Stack>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', bgcolor: alpha(theme.palette.background.paper, 0.2) }}>
                    <TablePagination
                        component="div"
                        count={totalUsers}
                        page={page}
                        onPageChange={(_, p) => setPage(p)}
                        rowsPerPage={10}
                        rowsPerPageOptions={[10]}
                        sx={{ border: 'none', '& .MuiTablePagination-selectLabel, & .MuiTablePagination-input': { fontWeight: 800 } }}
                    />
                </Box>
            </GlassCard>

            {/* Premium Confirm Dialog */}
            <Dialog 
                open={!!deleteDialog} 
                onClose={() => setDeleteDialog(null)}
                PaperProps={{ 
                    sx: { 
                        bgcolor: 'background.paper', 
                        backgroundImage: 'none', 
                        borderRadius: 6, 
                        border: `1px solid ${alpha(theme.palette.error.main, 0.3)}`,
                        p: 2
                    } 
                }}
            >
                <DialogTitle sx={{ fontWeight: 900, fontFamily: 'Orbitron', color: 'error.main' }}>DELETE OPERATIVE?</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ fontWeight: 600, color: 'text.secondary' }}>
                        PERMANENT DELETION OF <strong style={{ color: theme.palette.text.primary }}>{deleteDialog?.name.toUpperCase()}</strong>. THIS ACTION IS IRREVERSIBLE.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setDeleteDialog(null)} sx={{ fontWeight: 900 }}>CANCEL</Button>
                    <GradientButton onClick={handleDelete} sx={{ bgcolor: 'error.main', color: 'white' }} disabled={actionLoading}>
                        {actionLoading ? <CircularProgress size={20} color="inherit" /> : 'CONFIRM PURGE'}
                    </GradientButton>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default AdminDashboardPage;
