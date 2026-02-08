import React from 'react';
import { format, subDays } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Download, ExternalLink } from 'lucide-react';

interface IncidentRecord {
  id: string;
  date: Date;
  downtime: string;
  responseSummary: string;
  notes: string;
}

interface IncidentsHistoryTableProps {
  monitorId: string;
  onViewAnalysis?: (incidentId: string) => void;
}

// Generate mock incidents
const generateIncidents = (monitorId: string): IncidentRecord[] => {
  const incidents: IncidentRecord[] = [
    {
      id: '1',
      date: new Date(2024, 0, 29, 8, 31, 0),
      downtime: '2 hrs 12 mins',
      responseSummary: 'HTTP ERROR 502',
      notes: 'Server overload during peak hours',
    },
    {
      id: '2',
      date: new Date(2023, 10, 17, 4, 37, 17),
      downtime: '1 hrs 12 mins',
      responseSummary: 'HTTP ERROR 502',
      notes: 'Database connection timeout',
    },
    {
      id: '3',
      date: new Date(2023, 9, 9, 0, 0, 0),
      downtime: '5 mins',
      responseSummary: 'HTTP ERROR 502',
      notes: 'Scheduled restart',
    },
    {
      id: '4',
      date: new Date(2023, 8, 10, 0, 12, 37),
      downtime: '2 mins',
      responseSummary: 'HTTP ERROR 502',
      notes: 'Brief network interruption',
    },
    {
      id: '5',
      date: new Date(2023, 8, 20, 12, 18, 0),
      downtime: '1 hrs 3 mins',
      responseSummary: 'HTTP ERROR 502',
      notes: 'Maintenance overrun',
    },
    {
      id: '6',
      date: new Date(2023, 6, 22, 0, 0, 0),
      downtime: '0 min',
      responseSummary: 'HTTP ERROR 502',
      notes: 'False positive - monitoring issue',
    },
  ];
  
  return incidents;
};

export const IncidentsHistoryTable: React.FC<IncidentsHistoryTableProps> = ({
  monitorId,
  onViewAnalysis,
}) => {
  const incidents = React.useMemo(() => generateIncidents(monitorId), [monitorId]);

  const handleExport = () => {
    const headers = ['Date & Time', 'Downtime', 'Response Summary', 'Notes'];
    const rows = incidents.map(inc => [
      format(inc.date, 'MMMM dd, yyyy hh:mm a'),
      inc.downtime,
      inc.responseSummary,
      inc.notes,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(c => `"${c}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `incidents-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">Incidents history</h3>
        <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" />
          Download incidents
        </Button>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">DATE & TIME</TableHead>
              <TableHead className="font-semibold">DOWNTIME</TableHead>
              <TableHead className="font-semibold">RESPONSE SUMMARY</TableHead>
              <TableHead className="font-semibold">NOTES</TableHead>
              <TableHead className="font-semibold w-[120px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {incidents.map((incident) => (
              <TableRow key={incident.id} className="hover:bg-muted/30">
                <TableCell>
                  <div>
                    <p className="font-medium">
                      {format(incident.date, 'MMMM dd, yyyy')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(incident.date, 'hh:mm a')}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{incident.downtime}</TableCell>
                <TableCell>
                  <span className="text-destructive font-medium">
                    {incident.responseSummary}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground max-w-[200px] truncate">
                  {incident.notes}
                </TableCell>
                <TableCell>
                  <Button
                    variant="link"
                    size="sm"
                    className="text-primary gap-1"
                    onClick={() => onViewAnalysis?.(incident.id)}
                  >
                    View Analysis
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};
