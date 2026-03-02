/**
 * Skill Gaps Section Component
 * Display skill gaps in a sortable table
 * 
 * Requirements: INT-1.7
 */

import { useState } from 'react';
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Chip,
  Box,
  Alert,
} from '@mui/material';
import { Warning } from '@mui/icons-material';
import type { SkillGaps } from '../../services/resumeAnalysisService';

interface SkillGapsProps {
  skillGaps: SkillGaps;
}

interface SkillGapRow {
  skill: string;
  importance: 'required' | 'preferred';
  currentLevel: string;
  targetLevel: string;
}

type SortOrder = 'asc' | 'desc';

function SkillGapsSection({ skillGaps }: SkillGapsProps) {
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Build skill gap rows
  const skillGapRows: SkillGapRow[] = [
    ...(skillGaps.required_missing || []).map((skill) => ({
      skill,
      importance: 'required' as const,
      currentLevel: 'None',
      targetLevel: 'Proficient',
    })),
    ...(skillGaps.preferred_missing || []).map((skill) => ({
      skill,
      importance: 'preferred' as const,
      currentLevel: 'None',
      targetLevel: 'Familiar',
    })),
  ];

  // Sort by importance
  const sortedRows = [...skillGapRows].sort((a, b) => {
    const importanceOrder = { required: 2, preferred: 1 };
    const aValue = importanceOrder[a.importance];
    const bValue = importanceOrder[b.importance];
    return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
  });

  const handleSortToggle = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const getImportanceColor = (importance: string) => {
    return importance === 'required' ? 'error' : 'warning';
  };

  if (skillGapRows.length === 0) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          <Warning sx={{ mr: 1, verticalAlign: 'middle' }} />
          Skill Gaps
        </Typography>
        <Alert severity="success">
          Great! No skill gaps identified for the target role "{skillGaps.target_role}".
          You have {skillGaps.match_percentage}% match.
        </Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          <Warning sx={{ mr: 1, verticalAlign: 'middle' }} />
          Skill Gaps for {skillGaps.target_role}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Skills to develop to improve your match from {skillGaps.match_percentage}% to 100%
        </Typography>
      </Box>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Skill</TableCell>
              <TableCell>
                <TableSortLabel
                  active
                  direction={sortOrder}
                  onClick={handleSortToggle}
                >
                  Importance
                </TableSortLabel>
              </TableCell>
              <TableCell>Current Level</TableCell>
              <TableCell>Target Level</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedRows.map((row, index) => (
              <TableRow key={index} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight="medium">
                    {row.skill}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={row.importance.toUpperCase()}
                    color={getImportanceColor(row.importance)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {row.currentLevel}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="primary.main" fontWeight="medium">
                    {row.targetLevel}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {skillGaps.recommendation && (
        <Alert severity="info" sx={{ mt: 2 }}>
          <Typography variant="body2">
            <strong>Recommendation:</strong> {skillGaps.recommendation}
          </Typography>
        </Alert>
      )}
    </Paper>
  );
}

export default SkillGapsSection;
