import { useState, useMemo } from 'react';
import { type Loan } from '../supabase';
import {
  Search,
  Plus,
  ArrowUpDown,
  Eye,
  Pencil,
  Trash2,
  Home,
  Car,
  GraduationCap,
  Briefcase,
  ShieldCheck,
  User,
  Wallet,
  ChevronRight
} from 'lucide-react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Input,
  HStack,
  Grid,
  Icon
} from '@chakra-ui/react';

interface LoansPanelProps {
  loans: Loan[];
  loansLoading: boolean;
  onViewDetail: (loan: Loan) => void;
  onEditLoan: (loan: Loan) => void;
  onDeleteLoan: (loanId: string) => void;
  onAddLoan: () => void;
}

// EMI calculation helper (reducing balance)
function calculateEMI(principal: number, annualRate: number, tenureMonths: number): number {
  if (annualRate === 0) return principal / tenureMonths;
  const r = annualRate / 100 / 12;
  return principal * r * Math.pow(1 + r, tenureMonths) / (Math.pow(1 + r, tenureMonths) - 1);
}

// Loan type icon mapping
function getLoanTypeIcon(type: string) {
  switch (type) {
    case 'Home': return Home;
    case 'Car': return Car;
    case 'Education': return GraduationCap;
    case 'Business': return Briefcase;
    case 'Insurance': return ShieldCheck;
    case 'Personal': return User;
    default: return Wallet;
  }
}

// Loan type gradient mapping
function getLoanTypeGradient(type: string): { from: string; to: string; bg: string } {
  switch (type) {
    case 'Home': return { from: '#6366f1', to: '#8b5cf6', bg: 'rgba(99, 102, 241, 0.08)' };
    case 'Car': return { from: '#3b82f6', to: '#06b6d4', bg: 'rgba(59, 130, 246, 0.08)' };
    case 'Education': return { from: '#8b5cf6', to: '#d946ef', bg: 'rgba(139, 92, 246, 0.08)' };
    case 'Business': return { from: '#f59e0b', to: '#f97316', bg: 'rgba(245, 158, 11, 0.08)' };
    case 'Insurance': return { from: '#10b981', to: '#14b8a6', bg: 'rgba(16, 185, 129, 0.08)' };
    case 'Personal': return { from: '#ec4899', to: '#f43f5e', bg: 'rgba(236, 72, 153, 0.08)' };
    default: return { from: '#64748b', to: '#94a3b8', bg: 'rgba(100, 116, 139, 0.08)' };
  }
}

// Health status
function getLoanHealth(loan: Loan): { color: string; label: string; dot: string } {
  if (loan.status === 'Paid') return { color: '#059669', label: 'Completed', dot: '🟢' };
  if (loan.status === 'Pending') return { color: '#d97706', label: 'Pending', dot: '🟡' };

  // Active loan — check timeline
  const startDate = new Date(loan.installment_start_date);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + loan.tenure);
  const today = new Date();

  if (today > endDate) return { color: '#ef4444', label: 'Overdue', dot: '🔴' };

  const monthsRemaining = (endDate.getFullYear() - today.getFullYear()) * 12 + (endDate.getMonth() - today.getMonth());
  if (monthsRemaining <= 6) return { color: '#f59e0b', label: 'Nearing Maturity', dot: '🟡' };

  return { color: '#10b981', label: 'On Track', dot: '🟢' };
}

// Elapsed months calculation
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

type SortOption = 'newest' | 'amount-desc' | 'amount-asc' | 'tenure-remaining';

const rupeeFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
});

export function LoansPanel({
  loans,
  loansLoading,
  onViewDetail,
  onEditLoan,
  onDeleteLoan,
  onAddLoan
}: LoansPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Counts
  const activeCount = loans.filter(l => l.status === 'Active').length;
  const pendingCount = loans.filter(l => l.status === 'Pending').length;
  const paidCount = loans.filter(l => l.status === 'Paid').length;

  // Total outstanding
  const totalOutstanding = useMemo(() => {
    return loans
      .filter(l => l.status === 'Active')
      .reduce((sum, l) => {
        const elapsed = getElapsedMonths(l);
        const principalPaid = (l.loan_amount / l.tenure) * elapsed;
        return sum + (l.loan_amount - principalPaid);
      }, 0);
  }, [loans]);

  // Filtered and sorted
  const filteredLoans = useMemo(() => {
    let result = [...loans];

    // Filter by status
    if (filterStatus !== 'all') {
      result = result.filter(l => l.status === filterStatus);
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(l =>
        l.loan_number.toLowerCase().includes(q) ||
        l.loan_type.toLowerCase().includes(q)
      );
    }

    // Sort
    switch (sortBy) {
      case 'amount-desc':
        result.sort((a, b) => b.loan_amount - a.loan_amount);
        break;
      case 'amount-asc':
        result.sort((a, b) => a.loan_amount - b.loan_amount);
        break;
      case 'tenure-remaining':
        result.sort((a, b) => {
          const remA = a.tenure - getElapsedMonths(a);
          const remB = b.tenure - getElapsedMonths(b);
          return remA - remB;
        });
        break;
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
        break;
    }

    return result;
  }, [loans, searchQuery, sortBy, filterStatus]);

  return (
    <Box>
      {/* Page Header */}
      <Flex justify="space-between" align="flex-start" direction={{ base: "column", md: "row" }} gap={4} mb={8}>
        <Box>
          <Heading size="lg" fontWeight="extrabold" color="gray.950" fontSize={{ base: "2xl", sm: "3xl" }} letterSpacing="-0.03em" mb={1}>
            My Loans
          </Heading>
          <Text fontSize="sm" color="gray.500">
            Manage and track all your loan portfolios in one place.
          </Text>
        </Box>
        <Button
          onClick={onAddLoan}
          bgGradient="to-r"
          gradientFrom="indigo.600"
          gradientTo="purple.600"
          color="white"
          px={5}
          py={2}
          borderRadius="lg"
          _hover={{ opacity: 0.9, transform: 'translateY(-1px)' }}
          transition="all 0.2s"
          gap={2}
          boxShadow="0 4px 14px rgba(99, 102, 241, 0.3)"
        >
          <Plus size={16} /> New Loan
        </Button>
      </Flex>

      {/* Portfolio Summary Bar */}
      <Box
        bg="white"
        border="1px solid"
        borderColor="gray.200"
        borderRadius="xl"
        p={5}
        mb={6}
        boxShadow="sm"
      >
        <Flex
          justify="space-between"
          align="center"
          direction={{ base: "column", md: "row" }}
          gap={4}
        >
          <HStack gap={6} flexWrap="wrap">
            <HStack gap={2}>
              <Flex w="36px" h="36px" borderRadius="lg" bg="indigo.50" align="center" justify="center">
                <Icon as={Wallet} color="indigo.600" w="18px" h="18px" />
              </Flex>
              <Box>
                <Text fontSize="10px" color="gray.400" fontWeight="bold" textTransform="uppercase">Outstanding</Text>
                <Text fontSize="lg" fontWeight="extrabold" color="gray.900">{rupeeFormatter.format(totalOutstanding)}</Text>
              </Box>
            </HStack>
            <Box h="36px" w="1px" bg="gray.200" display={{ base: "none", md: "block" }} />
            <HStack gap={3} flexWrap="wrap">
              <HStack
                bg={filterStatus === 'all' ? 'indigo.50' : 'gray.50'}
                px={3} py={1.5} borderRadius="full" cursor="pointer"
                onClick={() => setFilterStatus('all')}
                border="1px solid"
                borderColor={filterStatus === 'all' ? 'indigo.200' : 'gray.200'}
                transition="all 0.15s"
              >
                <Text fontSize="xs" fontWeight="bold" color={filterStatus === 'all' ? 'indigo.700' : 'gray.600'}>
                  All {loans.length}
                </Text>
              </HStack>
              <HStack
                bg={filterStatus === 'Active' ? 'indigo.50' : 'gray.50'}
                px={3} py={1.5} borderRadius="full" cursor="pointer"
                onClick={() => setFilterStatus('Active')}
                border="1px solid"
                borderColor={filterStatus === 'Active' ? 'indigo.200' : 'gray.200'}
                transition="all 0.15s"
              >
                <Box w="6px" h="6px" borderRadius="full" bg="#4f46e5" />
                <Text fontSize="xs" fontWeight="bold" color={filterStatus === 'Active' ? 'indigo.700' : 'gray.600'}>
                  Active {activeCount}
                </Text>
              </HStack>
              <HStack
                bg={filterStatus === 'Pending' ? 'orange.50' : 'gray.50'}
                px={3} py={1.5} borderRadius="full" cursor="pointer"
                onClick={() => setFilterStatus('Pending')}
                border="1px solid"
                borderColor={filterStatus === 'Pending' ? 'orange.200' : 'gray.200'}
                transition="all 0.15s"
              >
                <Box w="6px" h="6px" borderRadius="full" bg="#d97706" />
                <Text fontSize="xs" fontWeight="bold" color={filterStatus === 'Pending' ? 'orange.700' : 'gray.600'}>
                  Pending {pendingCount}
                </Text>
              </HStack>
              <HStack
                bg={filterStatus === 'Paid' ? 'green.50' : 'gray.50'}
                px={3} py={1.5} borderRadius="full" cursor="pointer"
                onClick={() => setFilterStatus('Paid')}
                border="1px solid"
                borderColor={filterStatus === 'Paid' ? 'green.200' : 'gray.200'}
                transition="all 0.15s"
              >
                <Box w="6px" h="6px" borderRadius="full" bg="#059669" />
                <Text fontSize="xs" fontWeight="bold" color={filterStatus === 'Paid' ? 'green.700' : 'gray.600'}>
                  Paid {paidCount}
                </Text>
              </HStack>
            </HStack>
          </HStack>
        </Flex>
      </Box>

      {/* Search & Sort Row */}
      <Flex gap={3} mb={6} direction={{ base: "column", sm: "row" }}>
        <Box position="relative" flex={1}>
          <Box position="absolute" left="14px" top="50%" transform="translateY(-50%)" zIndex={2}>
            <Search size={16} color="#9ca3af" />
          </Box>
          <Input
            placeholder="Search by loan number or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            pl="40px"
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            h="44px"
            borderRadius="lg"
            fontSize="sm"
            color="gray.800"
            _focus={{ borderColor: "indigo.400", boxShadow: "0 0 0 3px rgba(99,102,241,0.1)" }}
            _placeholder={{ color: "gray.400" }}
          />
        </Box>
        <Button
          variant="outline"
          borderColor="gray.200"
          bg="white"
          color="gray.600"
          h="44px"
          px={4}
          borderRadius="lg"
          _hover={{ bg: "gray.50" }}
          gap={2}
          fontSize="sm"
          onClick={() => {
            const opts: SortOption[] = ['newest', 'amount-desc', 'amount-asc', 'tenure-remaining'];
            const idx = opts.indexOf(sortBy);
            setSortBy(opts[(idx + 1) % opts.length]);
          }}
        >
          <ArrowUpDown size={14} />
          {sortBy === 'newest' ? 'Newest' :
            sortBy === 'amount-desc' ? 'Amount ↓' :
              sortBy === 'amount-asc' ? 'Amount ↑' : 'Tenure Left'}
        </Button>
      </Flex>

      {/* Loans Grid */}
      {loansLoading ? (
        <Flex align="center" justify="center" py={16} color="gray.400" gap={3}>
          <Box
            w="22px"
            h="22px"
            border="2.5px solid rgba(99, 102, 241, 0.1)"
            borderTopColor="#6366f1"
            borderRadius="full"
            animation="spin 1s linear infinite"
          />
          <Text fontSize="sm">Loading your loans...</Text>
        </Flex>
      ) : filteredLoans.length === 0 ? (
        <Flex direction="column" align="center" justify="center" py={16}>
          <Flex
            w="80px" h="80px" borderRadius="2xl" mb={4}
            bgGradient="to-br" gradientFrom="indigo.50" gradientTo="purple.50"
            align="center" justify="center"
          >
            <Wallet size={32} color="#6366f1" />
          </Flex>
          <Heading size="sm" fontWeight="bold" color="gray.700" mb={2}>
            {searchQuery || filterStatus !== 'all' ? 'No matching loans found' : 'No loans yet'}
          </Heading>
          <Text fontSize="sm" color="gray.400" mb={6} textAlign="center">
            {searchQuery || filterStatus !== 'all'
              ? 'Try adjusting your search or filters.'
              : 'Start tracking your loans by creating your first entry.'}
          </Text>
          {!searchQuery && filterStatus === 'all' && (
            <Button
              onClick={onAddLoan}
              bgGradient="to-r"
              gradientFrom="indigo.600"
              gradientTo="purple.600"
              color="white"
              px={6}
              borderRadius="lg"
              gap={2}
              _hover={{ opacity: 0.9 }}
            >
              <Plus size={16} /> Create First Loan
            </Button>
          )}
        </Flex>
      ) : (
        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", xl: "repeat(3, 1fr)" }} gap={5}>
          {filteredLoans.map((loan) => {
            const LoanIcon = getLoanTypeIcon(loan.loan_type);
            const gradient = getLoanTypeGradient(loan.loan_type);
            const health = getLoanHealth(loan);
            const elapsed = getElapsedMonths(loan);
            const progress = loan.tenure > 0 ? (elapsed / loan.tenure) * 100 : 0;
            const emi = calculateEMI(loan.loan_amount, loan.roi, loan.tenure);

            const statusColors = loan.status === 'Paid'
              ? { bg: 'rgba(16, 185, 129, 0.1)', color: '#059669' }
              : loan.status === 'Active'
                ? { bg: 'rgba(99, 102, 241, 0.1)', color: '#4f46e5' }
                : { bg: 'rgba(245, 158, 11, 0.1)', color: '#d97706' };

            return (
              <Box
                key={loan.id}
                bg="white"
                border="1px solid"
                borderColor="gray.200"
                borderRadius="xl"
                overflow="hidden"
                transition="all 0.25s cubic-bezier(0.4, 0, 0.2, 1)"
                _hover={{
                  borderColor: "indigo.300",
                  boxShadow: "0 8px 30px rgba(99, 102, 241, 0.12)",
                  transform: "translateY(-2px)"
                }}
                cursor="pointer"
                onClick={() => onViewDetail(loan)}
                position="relative"
              >
                {/* Top color accent bar */}
                <Box
                  h="3px"
                  bgGradient="to-r"
                  gradientFrom={gradient.from}
                  gradientTo={gradient.to}
                />

                <Box p={5}>
                  {/* Card Header */}
                  <Flex justify="space-between" align="flex-start" mb={4}>
                    <HStack gap={3}>
                      <Flex
                        w="42px" h="42px" borderRadius="xl"
                        bg={gradient.bg}
                        align="center" justify="center"
                        flexShrink={0}
                      >
                        <LoanIcon size={20} color={gradient.from} />
                      </Flex>
                      <Box>
                        <Text fontSize="sm" fontWeight="bold" color="gray.900" lineHeight="1.2">
                          {loan.loan_type} Loan
                        </Text>
                        <Text fontSize="xs" color="indigo.600" fontWeight="semibold">
                          {loan.loan_number}
                        </Text>
                      </Box>
                    </HStack>
                    <HStack gap={2}>
                      <Text fontSize="10px" title={health.label}>{health.dot}</Text>
                      <Flex
                        bg={statusColors.bg}
                        color={statusColors.color}
                        px={2.5}
                        py={0.5}
                        borderRadius="full"
                        fontSize="10px"
                        fontWeight="bold"
                      >
                        {loan.status}
                      </Flex>
                    </HStack>
                  </Flex>

                  {/* Amount */}
                  <Text fontSize="2xl" fontWeight="extrabold" color="gray.900" mb={1} letterSpacing="-0.02em">
                    {rupeeFormatter.format(loan.loan_amount)}
                  </Text>

                  {/* Key Metrics */}
                  <Grid templateColumns="repeat(3, 1fr)" gap={3} mt={4} mb={4}>
                    <Box>
                      <Text fontSize="10px" color="gray.400" fontWeight="bold" textTransform="uppercase">EMI</Text>
                      <Text fontSize="sm" fontWeight="bold" color="gray.700">
                        {rupeeFormatter.format(emi)}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="10px" color="gray.400" fontWeight="bold" textTransform="uppercase">ROI</Text>
                      <Text fontSize="sm" fontWeight="bold" color="gray.700">{loan.roi}% p.a.</Text>
                    </Box>
                    <Box>
                      <Text fontSize="10px" color="gray.400" fontWeight="bold" textTransform="uppercase">Tenure</Text>
                      <Text fontSize="sm" fontWeight="bold" color="gray.700">{loan.tenure}mo</Text>
                    </Box>
                  </Grid>

                  {/* Progress Bar */}
                  <Box mb={3}>
                    <Flex justify="space-between" mb={1.5}>
                      <Text fontSize="10px" color="gray.400" fontWeight="bold">PROGRESS</Text>
                      <Text fontSize="10px" color="gray.500" fontWeight="bold">
                        {elapsed}/{loan.tenure} months ({Math.round(progress)}%)
                      </Text>
                    </Flex>
                    <Box bg="gray.100" h="6px" borderRadius="full" overflow="hidden">
                      <Box
                        h="100%"
                        borderRadius="full"
                        bgGradient="to-r"
                        gradientFrom={gradient.from}
                        gradientTo={gradient.to}
                        w={`${Math.min(progress, 100)}%`}
                        transition="width 0.6s cubic-bezier(0.4, 0, 0.2, 1)"
                      />
                    </Box>
                  </Box>

                  {/* Card Footer Actions */}
                  <Flex
                    justify="space-between"
                    align="center"
                    pt={3}
                    borderTop="1px solid"
                    borderColor="gray.100"
                  >
                    <HStack gap={1}>
                      <Button
                        size="xs"
                        variant="ghost"
                        color="gray.400"
                        _hover={{ bg: "gray.100", color: "indigo.600" }}
                        onClick={(e) => { e.stopPropagation(); onEditLoan(loan); }}
                        p={1.5}
                        h="28px"
                        w="28px"
                        borderRadius="md"
                      >
                        <Pencil size={13} />
                      </Button>
                      <Button
                        size="xs"
                        variant="ghost"
                        color="gray.400"
                        _hover={{ bg: "red.50", color: "red.600" }}
                        onClick={(e) => { e.stopPropagation(); onDeleteLoan(loan.id); }}
                        p={1.5}
                        h="28px"
                        w="28px"
                        borderRadius="md"
                      >
                        <Trash2 size={13} />
                      </Button>
                    </HStack>
                    <Button
                      size="xs"
                      variant="ghost"
                      color="indigo.600"
                      _hover={{ bg: "indigo.50" }}
                      gap={1}
                      px={3}
                      h="28px"
                      borderRadius="md"
                      fontWeight="bold"
                      fontSize="xs"
                      onClick={(e) => { e.stopPropagation(); onViewDetail(loan); }}
                    >
                      <Eye size={13} /> View Detail
                      <ChevronRight size={12} />
                    </Button>
                  </Flex>
                </Box>
              </Box>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}
