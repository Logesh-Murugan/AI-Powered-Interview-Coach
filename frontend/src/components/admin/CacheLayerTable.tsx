/**
 * Cache Layer Table Component
 * Display layer-by-layer cache statistics with sorting
 * 
 * Requirements: INT-4.4, INT-4.6
 */

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Paper,
  Chip,
} from '@mui/material';
import type { CacheLayerStats } from '../../services/cacheService';

interface CacheLayerTableProps {
  layers: CacheLayerStats[];
}

type SortOrder = 'asc' | 'desc';

const CacheLayerTable: React.FC<CacheLayerTableProps> = ({ layers }) => {
  const [orderBy, setOrderBy] = useState<keyof CacheLayerStats>('hit_rate');
  const [order, setOrder] = useState<SortOrder>('desc');

  const handleSort = (property: keyof CacheLayerStats) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedLayers = [...layers].sort((a, b) => {
    const aValue = a[orderBy];
    const bValue = b[orderBy];
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return order === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  });

  // Color-code hit rates
  const getHitRateColor = (hitRate: number): 'success' | 'warning' | 'error' => {
    const percentage = hitRate * 100;
    if (percentage > 90) return 'success';
    if (percentage >= 85) return 'warning';
    return 'error';
  };

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>
              <TableSortLabel
                active={orderBy === 'cache_layer'}
                direction={orderBy === 'cache_layer' ? order : 'asc'}
                onClick={() => handleSort('cache_layer')}
              >
                Layer
              </TableSortLabel>
            </TableCell>
            <TableCell align="right">
              <TableSortLabel
                active={orderBy === 'cache_hits'}
                direction={orderBy === 'cache_hits' ? order : 'asc'}
                onClick={() => handleSort('cache_hits')}
              >
                Hits
              </TableSortLabel>
            </TableCell>
            <TableCell align="right">
              <TableSortLabel
                active={orderBy === 'cache_misses'}
                direction={orderBy === 'cache_misses' ? order : 'asc'}
                onClick={() => handleSort('cache_misses')}
              >
                Misses
              </TableSortLabel>
            </TableCell>
            <TableCell align="right">
              <TableSortLabel
                active={orderBy === 'hit_rate'}
                direction={orderBy === 'hit_rate' ? order : 'asc'}
                onClick={() => handleSort('hit_rate')}
              >
                Hit Rate
              </TableSortLabel>
            </TableCell>
            <TableCell align="right">
              <TableSortLabel
                active={orderBy === 'total_requests'}
                direction={orderBy === 'total_requests' ? order : 'asc'}
                onClick={() => handleSort('total_requests')}
              >
                Total Requests
              </TableSortLabel>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedLayers.map((layer) => (
            <TableRow key={layer.cache_layer} hover>
              <TableCell component="th" scope="row">
                {layer.cache_layer}
              </TableCell>
              <TableCell align="right">{layer.cache_hits.toLocaleString()}</TableCell>
              <TableCell align="right">{layer.cache_misses.toLocaleString()}</TableCell>
              <TableCell align="right">
                <Chip
                  label={`${(layer.hit_rate * 100).toFixed(1)}%`}
                  color={getHitRateColor(layer.hit_rate)}
                  size="small"
                />
              </TableCell>
              <TableCell align="right">{layer.total_requests.toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default CacheLayerTable;
