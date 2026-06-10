import { useMemo, useState } from 'react';
import { type Loan } from '../supabase';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import {
  ArrowLeft,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  Clock,
  Percent,
  CheckCircle,
  Target,
  PiggyBank,
  CalendarCheck,
  CalendarClock,
  BarChart3,
  Maximize2,
  X
} from 'lucide-react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Grid,
  Portal
} from '@chakra-ui/react';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface LoanDetailPanelProps {
  loan: Loan;
  onBack: () => void;
}

// EMI formula (reducing balance)
function calculateEMI(principal: number, annualRate: number, tenureMonths: number): number {
  if (annualRate === 0) return principal / tenureMonths;
  const r = annualRate / 100 / 12;
  return principal * r * Math.pow(1 + r, tenureMonths) / (Math.pow(1 + r, tenureMonths) - 1);
}

// Generate full amortization schedule
interface AmortizationRow {
  month: number;
  label: string;
  interest: number;
  principal: number;
  emi: number;
  balance: number;
  cumulativePaid: number;
}

function generateAmortizationSchedule(
  loanAmount: number,
  annualRate: number,
  tenureMonths: number,
  startDate: Date
): AmortizationRow[] {
  const emi = calculateEMI(loanAmount, annualRate, tenureMonths);
  const r = annualRate / 100 / 12;
  let balance = loanAmount;
  let cumulativePaid = 0;
  const schedule: AmortizationRow[] = [];

  for (let month = 1; month <= tenureMonths; month++) {
    const interest = annualRate === 0 ? 0 : balance * r;
    const principal = emi - interest;
    balance = Math.max(0, balance - principal);
    cumulativePaid += emi;

    const d = new Date(startDate);
    d.setMonth(d.getMonth() + month - 1);
    const label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });

    schedule.push({ month, label, interest, principal, emi, balance, cumulativePaid });
  }

  return schedule;
}

// Elapsed months
function getElapsedMonths(loan: Loan): number {
  if (loan.status === 'Pending') return 0;
  if (loan.status === 'Paid') return loan.tenure;

  const startDate = new Date(loan.installment_start_date);
  const today = new Date();
  if (today < startDate) return 0;

  const diffYears = today.getFullYear() - startDate.getFullYear();
  const diffMonths = today.getMonth() - startDate.getMonth();
  let elapsed = diffYears * 12 + diffMonths;
  if (today.getDate() >= startDate.getDate()) elapsed += 1;
  return Math.min(elapsed, loan.tenure);
}

const rupeeFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
});

const rupeeFormatterDecimals = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2
});

export function LoanDetailPanel({ loan, onBack }: LoanDetailPanelProps) {
  const [viewMode, setViewMode] = useState<'chart' | 'table'>('chart');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const startDate = new Date(loan.installment_start_date);
  const emi = calculateEMI(loan.loan_amount, loan.roi, loan.tenure);
  const elapsed = getElapsedMonths(loan);
  const remaining = loan.tenure - elapsed;
  const progress = loan.tenure > 0 ? (elapsed / loan.tenure) * 100 : 0;

  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + loan.tenure);

  // Generate schedule
  const schedule = useMemo(
    () => generateAmortizationSchedule(loan.loan_amount, loan.roi, loan.tenure, startDate),
    [loan.loan_amount, loan.roi, loan.tenure, loan.installment_start_date]
  );

  // Financial aggregates
  const totalInterestFull = schedule.reduce((s, r) => s + r.interest, 0);
  const totalLoanValue = loan.loan_amount + totalInterestFull;

  const interestPaid = schedule.slice(0, elapsed).reduce((s, r) => s + r.interest, 0);
  const principalPaid = schedule.slice(0, elapsed).reduce((s, r) => s + r.principal, 0);
  const totalPaid = interestPaid + principalPaid;
  const outstandingBalance = loan.loan_amount - principalPaid;

  // Early closure savings
  const interestRemaining = totalInterestFull - interestPaid;

  // Chart data
  const chartData = useMemo(() => {
    const labels = schedule.map(r => r.label);
    const isCurrentActive = loan.status === 'Active';
    return {
      labels,
      datasets: [
        {
          type: 'bar' as const,
          label: 'Interest',
          data: schedule.map(r => Math.round(r.interest)),
          backgroundColor: schedule.map(r => (r.month === elapsed && isCurrentActive) ? 'rgba(236, 72, 153, 1)' : 'rgba(236, 72, 153, 0.45)'),
          borderColor: schedule.map(r => (r.month === elapsed && isCurrentActive) ? '#f59e0b' : 'rgba(236, 72, 153, 1)'),
          borderWidth: schedule.map(r => (r.month === elapsed && isCurrentActive) ? 2.5 : 1),
          borderRadius: { topLeft: 3, topRight: 3 },
          stack: 'monthly',
          order: 2,
        },
        {
          type: 'bar' as const,
          label: 'Principal',
          data: schedule.map(r => Math.round(r.principal)),
          backgroundColor: schedule.map(r => (r.month === elapsed && isCurrentActive) ? 'rgba(99, 102, 241, 1)' : 'rgba(99, 102, 241, 0.45)'),
          borderColor: schedule.map(r => (r.month === elapsed && isCurrentActive) ? '#f59e0b' : 'rgba(99, 102, 241, 1)'),
          borderWidth: schedule.map(r => (r.month === elapsed && isCurrentActive) ? 2.5 : 1),
          borderRadius: { topLeft: 3, topRight: 3 },
          stack: 'monthly',
          order: 1,
        },
        {
          type: 'line' as const,
          label: 'Cumulative Paid',
          data: schedule.map(r => Math.round(r.cumulativePaid)),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.08)',
          borderWidth: 2.5,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: '#10b981',
          pointHoverBorderColor: '#fff',
          pointHoverBorderWidth: 2,
          tension: 0.3,
          fill: true,
          yAxisID: 'y1',
          order: 0,
        }
      ]
    };
  }, [schedule, elapsed, loan.status]);

  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          pointStyle: 'rectRounded',
          padding: 20,
          font: {
            family: "'Plus Jakarta Sans', sans-serif",
            size: 12,
            weight: 600 as const,
          },
          color: '#64748b',
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleFont: { family: "'Plus Jakarta Sans', sans-serif", size: 13, weight: 700 as const },
        bodyFont: { family: "'Plus Jakarta Sans', sans-serif", size: 12 },
        padding: 14,
        cornerRadius: 10,
        borderColor: 'rgba(99, 102, 241, 0.2)',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            const value = context.parsed.y;
            return ` ${context.dataset.label}: ${rupeeFormatter.format(value)}`;
          }
        }
      },
      annotation: elapsed > 0 && elapsed < loan.tenure ? {
        annotations: {
          currentMonth: {
            type: 'line',
            xMin: elapsed - 0.5,
            xMax: elapsed - 0.5,
            borderColor: '#f59e0b',
            borderWidth: 2,
            borderDash: [5, 5],
            label: {
              display: true,
              content: 'Today',
              position: 'start',
              backgroundColor: '#f59e0b',
              color: '#fff',
              font: { size: 10, weight: '600' },
              padding: 4,
              borderRadius: 4,
            }
          }
        }
      } : undefined,
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: { family: "'Plus Jakarta Sans', sans-serif", size: 10 },
          color: '#94a3b8',
          maxRotation: 45,
          autoSkip: true,
          maxTicksLimit: 24,
        },
        border: {
          display: false,
        }
      },
      y: {
        position: 'left' as const,
        stacked: true,
        grid: {
          color: 'rgba(0,0,0,0.04)',
        },
        ticks: {
          font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 },
          color: '#94a3b8',
          callback: function(value: any) {
            if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
            if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
            return `₹${value}`;
          }
        },
        border: {
          display: false,
        },
        title: {
          display: true,
          text: 'Monthly Amount (₹)',
          font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, weight: 600 as const },
          color: '#94a3b8',
        }
      },
      y1: {
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 },
          color: '#10b981',
          callback: function(value: any) {
            if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
            if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
            if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
            return `₹${value}`;
          }
        },
        border: {
          display: false,
        },
        title: {
          display: true,
          text: 'Cumulative Paid (₹)',
          font: { family: "'Plus Jakarta Sans', sans-serif", size: 11, weight: 600 as const },
          color: '#10b981',
        }
      }
    }
  }), [elapsed, loan.tenure]);

  // Donut chart data for interest vs principal split
  const interestPercent = totalLoanValue > 0 ? (totalInterestFull / totalLoanValue) * 100 : 0;
  const principalPercent = 100 - interestPercent;

  // Donut SVG parameters
  const donutRadius = 52;
  const donutStroke = 14;
  const donutCircumference = 2 * Math.PI * donutRadius;
  const interestArc = (interestPercent / 100) * donutCircumference;
  const principalArc = (principalPercent / 100) * donutCircumference;

  // Progress ring parameters
  const ringRadius = 44;
  const ringStroke = 8;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (progress / 100) * ringCircumference;

  // Status colors
  const statusColors = loan.status === 'Paid'
    ? { bg: 'rgba(16, 185, 129, 0.1)', color: '#059669', text: 'Paid' }
    : loan.status === 'Active'
      ? { bg: 'rgba(99, 102, 241, 0.1)', color: '#4f46e5', text: 'Active' }
      : { bg: 'rgba(245, 158, 11, 0.1)', color: '#d97706', text: 'Pending' };

  return (
    <Box w="100%" minW={0} overflow="hidden">
      {/* Back Button & Header */}
      <Flex align="center" gap={3} mb={6}>
        <Button
          onClick={onBack}
          variant="ghost"
          color="gray.500"
          _hover={{ bg: "gray.100", color: "indigo.600" }}
          p={2}
          h="36px"
          w="36px"
          borderRadius="lg"
        >
          <ArrowLeft size={18} />
        </Button>
        <Box flex={1}>
          <HStack gap={3} mb={1}>
            <Heading size="lg" fontWeight="extrabold" color="gray.950" fontSize={{ base: "xl", sm: "2xl" }} letterSpacing="-0.03em">
              {loan.loan_type} Loan — {loan.loan_number}
            </Heading>
            <Flex
              bg={statusColors.bg}
              color={statusColors.color}
              px={3}
              py={1}
              borderRadius="full"
              fontSize="xs"
              fontWeight="bold"
            >
              {statusColors.text}
            </Flex>
          </HStack>
          <Text fontSize="sm" color="gray.500">
            Detailed breakdown and amortization analysis
          </Text>
        </Box>
      </Flex>

      {/* Section 1: Financial Overview Cards */}
      <Grid templateColumns={{ base: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }} gap={4} mb={8}>
        {/* Total Interest Paid */}
        <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" p={5} boxShadow="sm" position="relative" overflow="hidden">
          <Box position="absolute" top={0} left={0} right={0} h="3px" bgGradient="to-r" gradientFrom="#ec4899" gradientTo="#f43f5e" />
          <Flex justify="space-between" align="center" mb={3}>
            <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase">Interest Paid</Text>
            <Flex w="32px" h="32px" borderRadius="lg" bg="pink.50" align="center" justify="center">
              <TrendingUp size={16} color="#ec4899" />
            </Flex>
          </Flex>
          <Text fontSize={{ base: "lg", sm: "xl" }} fontWeight="extrabold" color="gray.900" letterSpacing="-0.02em">
            {rupeeFormatter.format(interestPaid)}
          </Text>
          <Text fontSize="10px" color="gray.400" mt={1}>
            of {rupeeFormatter.format(totalInterestFull)} total interest
          </Text>
        </Box>

        {/* Total Principal Paid */}
        <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" p={5} boxShadow="sm" position="relative" overflow="hidden">
          <Box position="absolute" top={0} left={0} right={0} h="3px" bgGradient="to-r" gradientFrom="#6366f1" gradientTo="#8b5cf6" />
          <Flex justify="space-between" align="center" mb={3}>
            <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase">Principal Paid</Text>
            <Flex w="32px" h="32px" borderRadius="lg" bg="indigo.50" align="center" justify="center">
              <IndianRupee size={16} color="#6366f1" />
            </Flex>
          </Flex>
          <Text fontSize={{ base: "lg", sm: "xl" }} fontWeight="extrabold" color="gray.900" letterSpacing="-0.02em">
            {rupeeFormatter.format(principalPaid)}
          </Text>
          <Text fontSize="10px" color="gray.400" mt={1}>
            of {rupeeFormatter.format(loan.loan_amount)} principal
          </Text>
        </Box>

        {/* Total Loan Value */}
        <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" p={5} boxShadow="sm" position="relative" overflow="hidden">
          <Box position="absolute" top={0} left={0} right={0} h="3px" bgGradient="to-r" gradientFrom="#f59e0b" gradientTo="#f97316" />
          <Flex justify="space-between" align="center" mb={3}>
            <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase">Total Loan Value</Text>
            <Flex w="32px" h="32px" borderRadius="lg" bg="orange.50" align="center" justify="center">
              <Wallet size={16} color="#f59e0b" />
            </Flex>
          </Flex>
          <Text fontSize={{ base: "lg", sm: "xl" }} fontWeight="extrabold" color="gray.900" letterSpacing="-0.02em">
            {rupeeFormatter.format(totalLoanValue)}
          </Text>
          <Text fontSize="10px" color="gray.400" mt={1}>
            Principal + Total Interest
          </Text>
        </Box>

        {/* Total Amount Paid */}
        <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" p={5} boxShadow="sm" position="relative" overflow="hidden">
          <Box position="absolute" top={0} left={0} right={0} h="3px" bgGradient="to-r" gradientFrom="#10b981" gradientTo="#14b8a6" />
          <Flex justify="space-between" align="center" mb={3}>
            <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase">Total Paid</Text>
            <Flex w="32px" h="32px" borderRadius="lg" bg="green.50" align="center" justify="center">
              <CheckCircle size={16} color="#10b981" />
            </Flex>
          </Flex>
          <Text fontSize={{ base: "lg", sm: "xl" }} fontWeight="extrabold" color="gray.900" letterSpacing="-0.02em">
            {rupeeFormatter.format(totalPaid)}
          </Text>
          <Text fontSize="10px" color="gray.400" mt={1}>
            {elapsed} EMI{elapsed !== 1 ? 's' : ''} paid so far
          </Text>
        </Box>
      </Grid>

      {/* Section 2: Chart + Donut Side-by-Side */}
      <Grid templateColumns={{ base: "1fr", xl: "1fr 300px" }} gap={6} mb={8} minW={0}>
        {/* Amortization Chart */}
        <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" p={{ base: 4, sm: 6 }} boxShadow="sm" minW={0} overflow="hidden">
          <Flex justify="space-between" align={{ base: "flex-start", sm: "center" }} mb={5} direction={{ base: "column", sm: "row" }} gap={3}>
            <Box>
              <HStack gap={2} mb={1}>
                <BarChart3 size={18} color="#6366f1" />
                <Heading size="sm" fontWeight="bold" color="gray.900" fontSize="md">
                  Amortization Schedule
                </Heading>
              </HStack>
              <Text fontSize="xs" color="gray.500">
                Month-by-month interest and principal breakdown
              </Text>
            </Box>
            <HStack gap={2} alignSelf={{ base: "flex-end", sm: "auto" }}>
              {/* Toggle View Mode */}
              <HStack gap={1} bg="gray.100" p="3px" borderRadius="lg">
                <Button
                  size="xs"
                  variant={viewMode === 'chart' ? 'solid' : 'ghost'}
                  bg={viewMode === 'chart' ? 'white' : 'transparent'}
                  color={viewMode === 'chart' ? 'indigo.700' : 'gray.500'}
                  boxShadow={viewMode === 'chart' ? 'sm' : 'none'}
                  _hover={{ bg: viewMode === 'chart' ? 'white' : 'gray.200' }}
                  px={3}
                  h="28px"
                  borderRadius="md"
                  onClick={() => setViewMode('chart')}
                  fontSize="xs"
                  fontWeight="bold"
                >
                  Chart
                </Button>
                <Button
                  size="xs"
                  variant={viewMode === 'table' ? 'solid' : 'ghost'}
                  bg={viewMode === 'table' ? 'white' : 'transparent'}
                  color={viewMode === 'table' ? 'indigo.700' : 'gray.500'}
                  boxShadow={viewMode === 'table' ? 'sm' : 'none'}
                  _hover={{ bg: viewMode === 'table' ? 'white' : 'gray.200' }}
                  px={3}
                  h="28px"
                  borderRadius="md"
                  onClick={() => setViewMode('table')}
                  fontSize="xs"
                  fontWeight="bold"
                >
                  Table
                </Button>
              </HStack>

              {/* Expand Toggle */}
              <Button
                size="xs"
                variant="outline"
                borderColor="gray.200"
                color="gray.600"
                _hover={{ bg: "gray.50" }}
                onClick={() => setIsModalOpen(true)}
                h="34px"
                w="34px"
                p={0}
                borderRadius="lg"
                title="Expand to Fullscreen Dialog"
              >
                <Maximize2 size={15} />
              </Button>
            </HStack>
          </Flex>
          <Box
            h={{ base: "300px", sm: "380px" }}
            position="relative"
            overflow="auto"
          >
            {viewMode === 'chart' ? (
              <Box minW={loan.tenure > 36 ? `${loan.tenure * 28}px` : "100%"} h="100%">
                {/* @ts-ignore - Chart.js mixed chart types */}
                <Bar data={chartData} options={chartOptions} />
              </Box>
            ) : (
              <Box overflowX="auto" w="100%" pr={1}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid', borderColor: '#e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: '10px 8px', color: '#64748b', fontWeight: 'bold' }}>MONTH</th>
                      <th style={{ padding: '10px 8px', color: '#64748b', fontWeight: 'bold', textAlign: 'right' }}>PRINCIPAL</th>
                      <th style={{ padding: '10px 8px', color: '#64748b', fontWeight: 'bold', textAlign: 'right' }}>INTEREST</th>
                      <th style={{ padding: '10px 8px', color: '#64748b', fontWeight: 'bold', textAlign: 'right' }}>EMI</th>
                      <th style={{ padding: '10px 8px', color: '#64748b', fontWeight: 'bold', textAlign: 'right' }}>BALANCE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.map((row) => {
                      const isCurrent = row.month === elapsed && loan.status === 'Active';
                      return (
                        <tr 
                          key={row.month} 
                          style={{ 
                            borderBottom: '1px solid #f1f5f9',
                            backgroundColor: isCurrent ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                            fontWeight: isCurrent ? 'bold' : 'normal',
                          }}
                        >
                          <td style={{ padding: '10px 8px', color: isCurrent ? '#4f46e5' : '#1e293b' }}>
                            {row.label} {isCurrent && ' (Current Month)'}
                          </td>
                          <td style={{ padding: '10px 8px', textAlign: 'right', color: '#334155' }}>
                            {rupeeFormatter.format(row.principal)}
                          </td>
                          <td style={{ padding: '10px 8px', textAlign: 'right', color: '#334155' }}>
                            {rupeeFormatter.format(row.interest)}
                          </td>
                          <td style={{ padding: '10px 8px', textAlign: 'right', color: '#334155' }}>
                            {rupeeFormatter.format(row.emi)}
                          </td>
                          <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 'bold', color: isCurrent ? '#4f46e5' : '#475569' }}>
                            {rupeeFormatter.format(row.balance)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Box>
            )}
          </Box>
        </Box>

        {/* Donut Chart + Progress Ring */}
        <VStack gap={6}>
          {/* Interest vs Principal Donut */}
          <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" p={5} boxShadow="sm" w="100%">
            <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase" mb={4}>
              Interest vs Principal Split
            </Text>
            <Flex justify="center" mb={4}>
              <svg width="140" height="140" viewBox="0 0 140 140">
                <circle
                  cx="70" cy="70" r={donutRadius}
                  fill="none" stroke="rgba(99, 102, 241, 0.15)" strokeWidth={donutStroke}
                />
                {/* Principal arc */}
                <circle
                  cx="70" cy="70" r={donutRadius}
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth={donutStroke}
                  strokeDasharray={`${principalArc} ${donutCircumference}`}
                  strokeDashoffset={0}
                  strokeLinecap="round"
                  transform="rotate(-90 70 70)"
                  style={{ transition: 'stroke-dasharray 0.8s ease' }}
                />
                {/* Interest arc */}
                <circle
                  cx="70" cy="70" r={donutRadius}
                  fill="none"
                  stroke="#ec4899"
                  strokeWidth={donutStroke}
                  strokeDasharray={`${interestArc} ${donutCircumference}`}
                  strokeDashoffset={-principalArc}
                  strokeLinecap="round"
                  transform="rotate(-90 70 70)"
                  style={{ transition: 'stroke-dasharray 0.8s ease' }}
                />
                <text x="70" y="66" textAnchor="middle" fontSize="15" fontWeight="800" fill="#1e293b" fontFamily="'Plus Jakarta Sans', sans-serif">
                  {Math.round(principalPercent)}%
                </text>
                <text x="70" y="82" textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="'Plus Jakarta Sans', sans-serif">
                  Principal
                </text>
              </svg>
            </Flex>
            <HStack justify="center" gap={5}>
              <HStack gap={2}>
                <Box w="10px" h="10px" borderRadius="full" bg="#6366f1" />
                <Text fontSize="xs" color="gray.600" fontWeight="semibold">
                  Principal ({Math.round(principalPercent)}%)
                </Text>
              </HStack>
              <HStack gap={2}>
                <Box w="10px" h="10px" borderRadius="full" bg="#ec4899" />
                <Text fontSize="xs" color="gray.600" fontWeight="semibold">
                  Interest ({Math.round(interestPercent)}%)
                </Text>
              </HStack>
            </HStack>
          </Box>

          {/* Payment Completion Ring */}
          <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" p={5} boxShadow="sm" w="100%">
            <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase" mb={4}>
              Payment Completion
            </Text>
            <Flex justify="center" mb={3}>
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle
                  cx="60" cy="60" r={ringRadius}
                  fill="none"
                  stroke="rgba(99, 102, 241, 0.1)"
                  strokeWidth={ringStroke}
                />
                <circle
                  cx="60" cy="60" r={ringRadius}
                  fill="none"
                  stroke="url(#progressGradient)"
                  strokeWidth={ringStroke}
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringOffset}
                  transform="rotate(-90 60 60)"
                  style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#a855f7" />
                  </linearGradient>
                </defs>
                <text x="60" y="56" textAnchor="middle" fontSize="20" fontWeight="800" fill="#1e293b" fontFamily="'Plus Jakarta Sans', sans-serif">
                  {Math.round(progress)}%
                </text>
                <text x="60" y="72" textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="'Plus Jakarta Sans', sans-serif">
                  completed
                </text>
              </svg>
            </Flex>
            <Text textAlign="center" fontSize="xs" color="gray.500">
              <Text as="span" fontWeight="bold" color="gray.700">{elapsed}</Text> of {loan.tenure} EMIs paid
            </Text>
          </Box>
        </VStack>
      </Grid>

      {/* Section 3: Loan Summary Info Grid */}
      <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={6} mb={8} minW={0}>
        {/* Loan Details */}
        <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" p={6} boxShadow="sm">
          <Heading size="sm" fontWeight="bold" color="gray.900" fontSize="md" mb={5}>
            Loan Summary
          </Heading>
          <VStack align="stretch" gap={0}>
            <SummaryRow
              icon={Calendar}
              iconColor="#6366f1"
              label="EMI Start Date"
              value={startDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
            />
            <SummaryRow
              icon={IndianRupee}
              iconColor="#059669"
              label="Monthly EMI"
              value={rupeeFormatterDecimals.format(emi)}
              highlight
            />
            <SummaryRow
              icon={Clock}
              iconColor="#f59e0b"
              label="Total Tenure"
              value={formatTenure(loan.tenure)}
            />
            <SummaryRow
              icon={CheckCircle}
              iconColor="#10b981"
              label="Months Completed"
              value={`${elapsed} of ${loan.tenure} months (${Math.round(progress)}%)`}
            />
            <SummaryRow
              icon={CalendarClock}
              iconColor="#8b5cf6"
              label="Months Remaining"
              value={`${remaining} month${remaining !== 1 ? 's' : ''}`}
            />
            <SummaryRow
              icon={CalendarCheck}
              iconColor="#3b82f6"
              label="Loan End Date"
              value={endDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
            />
            <SummaryRow
              icon={TrendingUp}
              iconColor="#ec4899"
              label="Interest Type"
              value={loan.interest_type}
            />
            <SummaryRow
              icon={Percent}
              iconColor="#0d9488"
              label="Rate of Interest"
              value={`${loan.roi}% p.a.`}
              isLast
            />
          </VStack>
        </Box>

        {/* Financial Insights */}
        <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" p={6} boxShadow="sm">
          <Heading size="sm" fontWeight="bold" color="gray.900" fontSize="md" mb={5}>
            Financial Insights
          </Heading>
          <VStack align="stretch" gap={0}>
            <SummaryRow
              icon={Target}
              iconColor="#6366f1"
              label="Outstanding Balance"
              value={rupeeFormatter.format(Math.max(0, outstandingBalance))}
              highlight
            />
            <SummaryRow
              icon={TrendingDown}
              iconColor="#10b981"
              label="Interest Remaining"
              value={rupeeFormatter.format(Math.max(0, interestRemaining))}
            />
            <SummaryRow
              icon={PiggyBank}
              iconColor="#f59e0b"
              label="Early Closure Savings"
              value={rupeeFormatter.format(Math.max(0, interestRemaining))}
              subtext="Interest saved if closed today"
            />
            <SummaryRow
              icon={Wallet}
              iconColor="#3b82f6"
              label="Total Cost of Loan"
              value={rupeeFormatter.format(totalLoanValue)}
            />
            <SummaryRow
              icon={TrendingUp}
              iconColor="#ec4899"
              label="Interest to Principal Ratio"
              value={`${(totalInterestFull / loan.loan_amount * 100).toFixed(1)}%`}
              subtext="Total interest as % of principal"
            />
            <SummaryRow
              icon={Calendar}
              iconColor="#8b5cf6"
              label="Projected Payoff Date"
              value={endDate.toLocaleDateString('en-IN', { year: 'numeric', month: 'long' })}
              isLast
            />
          </VStack>
        </Box>
      </Grid>

      {/* Expanded Amortization Modal Dialog */}
      {isModalOpen && (
        <Portal>
          {/* Backdrop with premium blur */}
          <Box 
            position="fixed"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="blackAlpha.600"
            backdropFilter="blur(6px)"
            zIndex={1200}
            onClick={() => setIsModalOpen(false)}
            transition="opacity 0.2s"
          />

          {/* Modal Container */}
          <Box 
            position="fixed"
            top="50%"
            left="50%"
            transform="translate(-50%, -50%)"
            width={{ base: "94%", md: "85%", lg: "75%", xl: "1000px" }}
            height="85vh"
            maxHeight="750px"
            bg="white"
            borderRadius="2xl"
            boxShadow="2xl"
            zIndex={1201}
            display="flex"
            flexDirection="column"
            overflow="hidden"
            p={{ base: 4, sm: 6 }}
            className="animate-fade-in"
            style={{
              animation: 'modalFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards'
            }}
          >
            {/* Style for animation */}
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes modalFadeIn {
                from { opacity: 0; transform: translate(-50%, -48%) scale(0.96); }
                to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
              }
            `}} />

            {/* Modal Header */}
            <Flex justify="space-between" align="center" mb={6} borderBottom="1px solid" borderColor="gray.150" pb={4}>
              <Box>
                <Heading size="md" fontWeight="extrabold" color="gray.950" fontSize="lg" mb={1}>
                  Amortization Schedule — {loan.loan_type} Loan
                </Heading>
                <Text fontSize="xs" color="gray.500">
                  Full monthly repayment schedule breakdown for agreement {loan.loan_number}
                </Text>
              </Box>
              
              <HStack gap={3}>
                {/* View Mode Segment Switcher inside Modal */}
                <HStack gap={1} bg="gray.100" p="3px" borderRadius="lg">
                  <Button
                    size="xs"
                    variant={viewMode === 'chart' ? 'solid' : 'ghost'}
                    bg={viewMode === 'chart' ? 'white' : 'transparent'}
                    color={viewMode === 'chart' ? 'indigo.700' : 'gray.500'}
                    boxShadow={viewMode === 'chart' ? 'sm' : 'none'}
                    _hover={{ bg: viewMode === 'chart' ? 'white' : 'gray.200' }}
                    px={3}
                    h="28px"
                    borderRadius="md"
                    onClick={() => setViewMode('chart')}
                    fontSize="xs"
                    fontWeight="bold"
                  >
                    Chart
                  </Button>
                  <Button
                    size="xs"
                    variant={viewMode === 'table' ? 'solid' : 'ghost'}
                    bg={viewMode === 'table' ? 'white' : 'transparent'}
                    color={viewMode === 'table' ? 'indigo.700' : 'gray.500'}
                    boxShadow={viewMode === 'table' ? 'sm' : 'none'}
                    _hover={{ bg: viewMode === 'table' ? 'white' : 'gray.200' }}
                    px={3}
                    h="28px"
                    borderRadius="md"
                    onClick={() => setViewMode('table')}
                    fontSize="xs"
                    fontWeight="bold"
                  >
                    Table
                  </Button>
                </HStack>

                {/* Close Button */}
                <Button 
                  onClick={() => setIsModalOpen(false)} 
                  variant="ghost" 
                  borderRadius="full" 
                  p={0} 
                  minW="36px" 
                  h="36px" 
                  color="gray.500"
                  _hover={{ bg: "gray.100", color: "gray.900" }}
                >
                  <X size={18} />
                </Button>
              </HStack>
            </Flex>

            {/* Modal Body / Scrollable Area */}
            <Box flex={1} overflow="auto" minH={0} pr={1}>
              {viewMode === 'chart' ? (
                <Box minW={loan.tenure > 24 ? `${loan.tenure * 28}px` : "100%"} h="95%">
                  {/* @ts-ignore */}
                  <Bar data={chartData} options={chartOptions} />
                </Box>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid', borderColor: '#e2e8f0', textAlign: 'left', position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 10 }}>
                      <th style={{ padding: '10px 8px', color: '#64748b', fontWeight: 'bold' }}>MONTH</th>
                      <th style={{ padding: '10px 8px', color: '#64748b', fontWeight: 'bold', textAlign: 'right' }}>PRINCIPAL</th>
                      <th style={{ padding: '10px 8px', color: '#64748b', fontWeight: 'bold', textAlign: 'right' }}>INTEREST</th>
                      <th style={{ padding: '10px 8px', color: '#64748b', fontWeight: 'bold', textAlign: 'right' }}>EMI</th>
                      <th style={{ padding: '10px 8px', color: '#64748b', fontWeight: 'bold', textAlign: 'right' }}>BALANCE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.map((row) => {
                      const isCurrent = row.month === elapsed && loan.status === 'Active';
                      return (
                        <tr 
                          key={row.month} 
                          style={{ 
                            borderBottom: '1px solid #f1f5f9',
                            backgroundColor: isCurrent ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
                            fontWeight: isCurrent ? 'bold' : 'normal',
                          }}
                        >
                          <td style={{ padding: '10px 8px', color: isCurrent ? '#4f46e5' : '#1e293b' }}>
                            {row.label} {isCurrent && ' (Current Month)'}
                          </td>
                          <td style={{ padding: '10px 8px', textAlign: 'right', color: '#334155' }}>
                            {rupeeFormatter.format(row.principal)}
                          </td>
                          <td style={{ padding: '10px 8px', textAlign: 'right', color: '#334155' }}>
                            {rupeeFormatter.format(row.interest)}
                          </td>
                          <td style={{ padding: '10px 8px', textAlign: 'right', color: '#334155' }}>
                            {rupeeFormatter.format(row.emi)}
                          </td>
                          <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: 'bold', color: isCurrent ? '#4f46e5' : '#475569' }}>
                            {rupeeFormatter.format(row.balance)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </Box>
          </Box>
        </Portal>
      )}
    </Box>
  );
}

// Summary row component
interface SummaryRowProps {
  icon: any;
  iconColor: string;
  label: string;
  value: string;
  highlight?: boolean;
  subtext?: string;
  isLast?: boolean;
}

function SummaryRow({ icon: IconComponent, iconColor, label, value, highlight, subtext, isLast }: SummaryRowProps) {
  return (
    <Flex
      py={3.5}
      borderBottom={isLast ? "none" : "1px solid"}
      borderColor="gray.100"
      justify="space-between"
      align="center"
      gap={3}
    >
      <HStack gap={3} flex={1}>
        <Flex w="30px" h="30px" borderRadius="lg" bg={`${iconColor}12`} align="center" justify="center" flexShrink={0}>
          <IconComponent size={14} color={iconColor} />
        </Flex>
        <Box>
          <Text fontSize="xs" color="gray.500" fontWeight="semibold">{label}</Text>
          {subtext && <Text fontSize="10px" color="gray.400">{subtext}</Text>}
        </Box>
      </HStack>
      <Text
        fontSize="sm"
        fontWeight={highlight ? "extrabold" : "bold"}
        color={highlight ? "indigo.600" : "gray.800"}
        textAlign="right"
      >
        {value}
      </Text>
    </Flex>
  );
}

// Tenure formatter
function formatTenure(months: number): string {
  const years = Math.floor(months / 12);
  const rem = months % 12;
  const yearText = years > 0 ? `${years} year${years === 1 ? '' : 's'}` : '';
  const monthText = rem > 0 ? `${rem} month${rem === 1 ? '' : 's'}` : '';
  if (yearText && monthText) return `${yearText} ${monthText}`;
  return yearText || monthText || '0 months';
}
