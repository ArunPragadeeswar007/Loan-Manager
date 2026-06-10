import { useState, useEffect } from 'react';
import { supabase, type Profile, type Loan, fetchLoans, deleteLoan } from '../supabase';
import { 
  LogOut, 
  DollarSign, 
  IndianRupee,
  TrendingUp, 
  Briefcase, 
  Activity, 
  Plus, 
  Settings,
  User,
  Users,
  Pencil,
  Trash2,
  Menu,
  X
} from 'lucide-react';
import { 
  Box, 
  Flex, 
  Heading, 
  Text, 
  Button, 
  Table, 
  Image, 
  VStack, 
  HStack,
  Grid,
  Icon
} from '@chakra-ui/react';
import { ProfilePage } from './ProfilePage';
import { AddLoanPanel } from './AddLoanPanel';
import { ReleaseNotesModal, CURRENT_RELEASE_VERSION } from './ReleaseNotesModal';
import { LoansPanel } from './LoansPanel';
import { LoanDetailPanel } from './LoanDetailPanel';


interface DashboardProps {
  user: any;
  profile: Profile | null;
  onLogout: () => void;
  onProfileUpdated: (updatedProfile: Profile) => void;
}

export function Dashboard({ user, profile, onLogout, onProfileUpdated }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile' | 'loans' | 'loan-detail'>('dashboard');
  const [detailLoan, setDetailLoan] = useState<Loan | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isAddLoanOpen, setIsAddLoanOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [loansLoading, setLoansLoading] = useState(true);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);

  useEffect(() => {
    const localStorageKey = `loan-manager-seen-release-${user?.id || 'anonymous'}`;
    const lastSeenVersion = localStorage.getItem(localStorageKey);
    if (lastSeenVersion !== CURRENT_RELEASE_VERSION) {
      setIsReleaseModalOpen(true);
    }
  }, [user?.id]);

  const handleCloseReleaseModal = () => {
    const localStorageKey = `loan-manager-seen-release-${user?.id || 'anonymous'}`;
    localStorage.setItem(localStorageKey, CURRENT_RELEASE_VERSION);
    setIsReleaseModalOpen(false);
  };

  useEffect(() => {
    async function loadLoans() {
      if (!user?.id) return;
      try {
        setLoansLoading(true);
        const data = await fetchLoans(user.id);
        setLoans(data);
      } catch (err) {
        console.error('Error fetching loans:', err);
      } finally {
        setLoansLoading(false);
      }
    }
    loadLoans();
  }, [user?.id]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  const handleLoanSaved = (savedLoan: Loan) => {
    setLoans(prev => {
      const exists = prev.some(l => l.id === savedLoan.id);
      if (exists) {
        return prev.map(l => l.id === savedLoan.id ? savedLoan : l);
      } else {
        return [savedLoan, ...prev];
      }
    });
  };

  const handleDeleteLoan = async (loanId: string) => {
    if (window.confirm("Are you sure you want to delete this loan agreement?")) {
      try {
        await deleteLoan(loanId);
        setLoans(prev => prev.filter(l => l.id !== loanId));
      } catch (err) {
        console.error("Failed to delete loan:", err);
        alert("Failed to delete the loan. Please try again.");
      }
    }
  };

  // Extract display name: use profile full name, or user metadata, or email
  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || null;
  const userEmail = profile?.email || user?.email || '';

  // Calculate stats at runtime
  const activeLoansCount = loans.filter(loan => loan.status === 'Active').length;
  const pendingLoansCount = loans.filter(loan => loan.status === 'Pending').length;

  const calculateRuntimePaid = (loan: Loan) => {
    const tenure = Number(loan.tenure);
    const amount = Number(loan.loan_amount);
    const roi = Number(loan.roi);
    
    if (loan.status === 'Paid') {
      const totalInterest = amount * (roi / 100) * (tenure / 12);
      return { principalPaid: amount, interestPaid: totalInterest };
    }
    
    if (loan.status === 'Pending') {
      return { principalPaid: 0, interestPaid: 0 };
    }
    
    // Active status: compute elapsed months since start date
    const startDate = new Date(loan.installment_start_date);
    const today = new Date();
    if (today < startDate) {
      return { principalPaid: 0, interestPaid: 0 };
    }
    
    const diffYears = today.getFullYear() - startDate.getFullYear();
    const diffMonths = today.getMonth() - startDate.getMonth();
    let monthsElapsed = diffYears * 12 + diffMonths;
    if (today.getDate() >= startDate.getDate()) {
      monthsElapsed += 1;
    }
    
    monthsElapsed = Math.min(monthsElapsed, tenure);
    
    const principalPaid = (amount / tenure) * monthsElapsed;
    const totalInterestProjected = amount * (roi / 100) * (tenure / 12);
    const interestPaid = (totalInterestProjected / tenure) * monthsElapsed;
    
    return { principalPaid, interestPaid };
  };

  const aggregates = loans.reduce(
    (acc, loan) => {
      const { principalPaid, interestPaid } = calculateRuntimePaid(loan);
      return {
        totalPrincipalPaid: acc.totalPrincipalPaid + principalPaid,
        totalInterestPaid: acc.totalInterestPaid + interestPaid
      };
    },
    { totalPrincipalPaid: 0, totalInterestPaid: 0 }
  );

  // Indian Rupee Currency Formatter
  const rupeeFormatter = new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: 'INR', 
    maximumFractionDigits: 0 
  });



  return (
    <Flex minH="100vh" bg="#F4F6FA" color="gray.700" fontFamily="body">
      {/* Mobile Navigation Drawer Overlay & Content */}
      {isMobileNavOpen && (
        <>
          <Box
            position="fixed"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="blackAlpha.600"
            backdropFilter="blur(4px)"
            zIndex={100}
            onClick={() => setIsMobileNavOpen(false)}
          />
          <Box
            position="fixed"
            top={0}
            left={0}
            bottom={0}
            w="280px"
            bg="white"
            boxShadow="2xl"
            zIndex={101}
            display={{ base: "flex", lg: "none" }}
            flexDirection="column"
            p={6}
            animation="slideInLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards"
          >
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes slideInLeft {
                from { transform: translateX(-100%); }
                to { transform: translateX(0); }
              }
            `}} />
            <Flex justify="space-between" align="center" mb={8}>
              <Flex align="center" gap={3}>
                <Briefcase size={22} color="#4f46e5" />
                <Heading size="xs" fontWeight="bold" color="gray.900" fontSize="xl" letterSpacing="-0.02em">
                  LoanManager
                </Heading>
              </Flex>
              <Button
                onClick={() => setIsMobileNavOpen(false)}
                variant="ghost"
                borderRadius="full"
                p={0}
                minW="32px"
                h="32px"
                color="gray.500"
                _hover={{ bg: "gray.100", color: "gray.900" }}
              >
                <X size={18} />
              </Button>
            </Flex>

            <VStack align="stretch" gap={2} flex={1}>
              <Button 
                onClick={() => { setActiveTab('dashboard'); setIsMobileNavOpen(false); }} 
                justifyContent="flex-start" 
                gap={3} 
                bg={activeTab === 'dashboard' ? 'indigo.50' : 'transparent'} 
                color={activeTab === 'dashboard' ? 'indigo.700' : 'gray.600'} 
                borderRadius="lg" 
                px={4} 
                py={6}
                _hover={{ bg: 'indigo.50', color: 'indigo.700' }}
                variant="ghost"
              >
                <Activity size={18} /> 
                <Text fontWeight={activeTab === 'dashboard' ? "bold" : "medium"} fontSize="sm">Dashboard</Text>
              </Button>

              <Button 
                onClick={() => { setActiveTab('loans'); setIsMobileNavOpen(false); }} 
                justifyContent="flex-start" 
                gap={3} 
                bg={activeTab === 'loans' || activeTab === 'loan-detail' ? 'indigo.50' : 'transparent'} 
                color={activeTab === 'loans' || activeTab === 'loan-detail' ? 'indigo.700' : 'gray.600'} 
                borderRadius="lg" 
                px={4} 
                py={6}
                _hover={{ bg: 'indigo.50', color: 'indigo.700' }}
                variant="ghost"
              >
                <DollarSign size={18} /> 
                <Text fontWeight={activeTab === 'loans' || activeTab === 'loan-detail' ? "bold" : "medium"} fontSize="sm">Loans</Text>
              </Button>
              
              <Button 
                onClick={() => { setActiveTab('profile'); setIsMobileNavOpen(false); }} 
                justifyContent="flex-start" 
                gap={3} 
                bg={activeTab === 'profile' ? 'indigo.50' : 'transparent'} 
                color={activeTab === 'profile' ? 'indigo.700' : 'gray.600'} 
                borderRadius="lg" 
                px={4} 
                py={6}
                _hover={{ bg: 'indigo.50', color: 'indigo.700' }}
                variant="ghost"
              >
                <User size={18} /> 
                <Text fontWeight={activeTab === 'profile' ? "bold" : "medium"} fontSize="sm">Profile</Text>
              </Button>
              
              <Button 
                justifyContent="flex-start" 
                gap={3} 
                bg="transparent" 
                color="gray.300" 
                borderRadius="lg" 
                px={4} 
                py={6}
                disabled 
                opacity={0.4} 
                cursor="not-allowed"
                variant="ghost"
              >
                <Users size={18} /> 
                <Text fontWeight="medium" fontSize="sm">Clients</Text>
              </Button>
              
              <Button 
                justifyContent="flex-start" 
                gap={3} 
                bg="transparent" 
                color="gray.300" 
                borderRadius="lg" 
                px={4} 
                py={6}
                disabled 
                opacity={0.4} 
                cursor="not-allowed"
                variant="ghost"
              >
                <Settings size={18} /> 
                <Text fontWeight="medium" fontSize="sm">Settings</Text>
              </Button>
            </VStack>

            <Box pt={4} borderTop="1px solid" borderColor="gray.100">
              <Button 
                onClick={handleLogout} 
                variant="outline" 
                borderColor="gray.200" 
                color="gray.600" 
                _hover={{ bg: "gray.50", color: "gray.900" }} 
                w="100%"
                gap={2}
              >
                <LogOut size={16} /> Logout
              </Button>
            </Box>
          </Box>
        </>
      )}

      {/* Sidebar Navigation */}
      <Box 
        w="260px" 
        bg="white" 
        borderRight="1px solid" 
        borderColor="gray.200" 
        p={6} 
        position="fixed" 
        top={0} 
        bottom={0} 
        left={0} 
        zIndex={10}
        display={{ base: "none", lg: "flex" }} 
        flexDirection="column"
        boxShadow="sm"
      >
        <Flex align="center" gap={3} mb={10}>
          <Briefcase size={22} color="#4f46e5" />
          <Heading size="xs" fontWeight="bold" color="gray.900" letterSpacing="-0.02em" fontSize="xl">
            LoanManager
          </Heading>
        </Flex>
        
        <VStack align="stretch" gap={2} flex={1}>
          <Button 
            onClick={() => setActiveTab('dashboard')} 
            justifyContent="flex-start" 
            gap={3} 
            bg={activeTab === 'dashboard' ? 'indigo.50' : 'transparent'} 
            color={activeTab === 'dashboard' ? 'indigo.700' : 'gray.600'} 
            borderRadius="lg" 
            px={4} 
            py={6}
            _hover={activeTab === 'dashboard' ? { bg: 'indigo.100' } : { bg: 'gray.100', color: 'gray.900' }}
            variant="ghost"
          >
            <Activity size={18} /> 
            <Text fontWeight={activeTab === 'dashboard' ? "bold" : "medium"} fontSize="sm">Dashboard</Text>
          </Button>

          <Button 
            onClick={() => setActiveTab('loans')} 
            justifyContent="flex-start" 
            gap={3} 
            bg={activeTab === 'loans' || activeTab === 'loan-detail' ? 'indigo.50' : 'transparent'} 
            color={activeTab === 'loans' || activeTab === 'loan-detail' ? 'indigo.700' : 'gray.600'} 
            borderRadius="lg" 
            px={4} 
            py={6}
            _hover={activeTab === 'loans' || activeTab === 'loan-detail' ? { bg: 'indigo.100' } : { bg: 'gray.100', color: 'gray.900' }}
            variant="ghost"
          >
            <DollarSign size={18} /> 
            <Text fontWeight={activeTab === 'loans' || activeTab === 'loan-detail' ? "bold" : "medium"} fontSize="sm">Loans</Text>
          </Button>
          
          <Button 
            onClick={() => setActiveTab('profile')} 
            justifyContent="flex-start" 
            gap={3} 
            bg={activeTab === 'profile' ? 'indigo.50' : 'transparent'} 
            color={activeTab === 'profile' ? 'indigo.700' : 'gray.600'} 
            borderRadius="lg" 
            px={4} 
            py={6}
            _hover={activeTab === 'profile' ? { bg: 'indigo.100' } : { bg: 'gray.100', color: 'gray.900' }}
            variant="ghost"
          >
            <User size={18} /> 
            <Text fontWeight={activeTab === 'profile' ? "bold" : "medium"} fontSize="sm">Profile</Text>
          </Button>
          
          <Button 
            justifyContent="flex-start" 
            gap={3} 
            bg="transparent" 
            color="gray.300" 
            borderRadius="lg" 
            px={4} 
            py={6}
            disabled 
            opacity={0.4} 
            cursor="not-allowed"
            variant="ghost"
          >
            <Users size={18} /> 
            <Text fontWeight="medium" fontSize="sm">Clients</Text>
          </Button>
          
          <Button 
            justifyContent="flex-start" 
            gap={3} 
            bg="transparent" 
            color="gray.300" 
            borderRadius="lg" 
            px={4} 
            py={6}
            disabled 
            opacity={0.4} 
            cursor="not-allowed"
            variant="ghost"
          >
            <Settings size={18} /> 
            <Text fontWeight="medium" fontSize="sm">Settings</Text>
          </Button>
        </VStack>

        <Box pt={4} borderTop="1px solid" borderColor="gray.100">
          <Button 
            onClick={handleLogout} 
            variant="outline" 
            borderColor="gray.200" 
            color="gray.600" 
            _hover={{ bg: "gray.50", color: "gray.900" }} 
            w="100%"
            gap={2}
          >
            <LogOut size={16} /> Logout
          </Button>
        </Box>
      </Box>

      {/* Main Content Area */}
      <Box 
        flex={1} 
        ml={{ base: 0, lg: "260px" }} 
        p={{ base: 4, sm: 6, lg: 10 }} 
        bg="#F4F6FA" 
        minH="100vh"
      >
        {/* Mobile Header Bar */}
        <Flex
          display={{ base: "flex", lg: "none" }}
          justify="space-between"
          align="center"
          p={4}
          bg="white"
          borderBottom="1px solid"
          borderColor="gray.200"
          position="sticky"
          top={0}
          zIndex={20}
          mx={{ base: -4, sm: -6 }}
          mt={{ base: -4, sm: -6 }}
          mb={6}
          boxShadow="sm"
        >
          <Flex align="center" gap={2}>
            <Button
              onClick={() => setIsMobileNavOpen(true)}
              variant="ghost"
              p={2}
              h="36px"
              w="36px"
              borderRadius="md"
              color="gray.600"
              _hover={{ bg: "gray.100" }}
            >
              <Menu size={20} />
            </Button>
            <Flex align="center" gap={2}>
              <Briefcase size={18} color="#4f46e5" />
              <Heading size="xs" fontWeight="bold" color="gray.900" fontSize="lg" letterSpacing="-0.02em">
                LoanManager
              </Heading>
            </Flex>
          </Flex>

          <HStack 
            onClick={() => setActiveTab('profile')}
            gap={2} 
            cursor="pointer"
          >
            {avatarUrl ? (
              <Image src={avatarUrl} alt={displayName} borderRadius="full" boxSize="32px" border="2px solid" borderColor="indigo.500" />
            ) : (
              <Flex borderRadius="full" boxSize="32px" bgGradient="to-tr" gradientFrom="indigo.500" gradientTo="purple.500" align="center" justify="center" fontWeight="bold" color="white" fontSize="xs">
                {displayName[0].toUpperCase()}
              </Flex>
            )}
          </HStack>
        </Flex>

        {activeTab === 'profile' ? (
          <ProfilePage 
            user={user} 
            profile={profile} 
            onProfileUpdated={onProfileUpdated} 
            onBack={() => setActiveTab('dashboard')} 
          />
        ) : activeTab === 'loans' ? (
          <LoansPanel
            loans={loans}
            loansLoading={loansLoading}
            onViewDetail={(loan) => { setDetailLoan(loan); setActiveTab('loan-detail'); }}
            onEditLoan={(loan) => { setSelectedLoan(loan); setIsAddLoanOpen(true); }}
            onDeleteLoan={handleDeleteLoan}
            onAddLoan={() => { setSelectedLoan(null); setIsAddLoanOpen(true); }}
          />
        ) : activeTab === 'loan-detail' && detailLoan ? (
          <LoanDetailPanel
            loan={detailLoan}
            onBack={() => setActiveTab('loans')}
          />
        ) : (
          <>
            {/* Top Navbar */}
            <Flex 
              justify="space-between" 
              align="center" 
              direction={{ base: "column", sm: "row" }} 
              gap={4} 
              mb={8}
            >
              <Box>
                <Heading size="lg" fontWeight="extrabold" color="gray.950" fontSize={{ base: "2xl", sm: "3xl" }} letterSpacing="-0.03em" mb={1}>
                  Welcome back, <Text as="span" color="indigo.600">{displayName}</Text>!
                </Heading>
                <Text fontSize="sm" color="gray.500">Here is what's happening with your loan portfolios today.</Text>
              </Box>

              <HStack 
                onClick={() => setActiveTab('profile')}
                gap={3} 
                p={2} 
                pl={2} 
                pr={4} 
                borderRadius="full" 
                bg="white" 
                border="1px solid" 
                borderColor="gray.200" 
                cursor="pointer" 
                _hover={{ bg: "gray.50" }}
                transition="background 0.2s"
                boxShadow="sm"
                display={{ base: "none", lg: "flex" }}
              >
                {avatarUrl ? (
                  <Image src={avatarUrl} alt={displayName} borderRadius="full" boxSize="38px" border="2px solid" borderColor="indigo.500" />
                ) : (
                  <Flex borderRadius="full" boxSize="38px" bgGradient="to-tr" gradientFrom="indigo.500" gradientTo="purple.500" align="center" justify="center" fontWeight="bold" color="white">
                    {displayName[0].toUpperCase()}
                  </Flex>
                )}
                <VStack align="flex-start" gap={0}>
                  <Text fontSize="xs" fontWeight="bold" color="gray.900" lineHeight="1.2">{displayName}</Text>
                  <Text fontSize="10px" color="gray.500" lineHeight="1.2">{userEmail}</Text>
                </VStack>
              </HStack>
            </Flex>

            {/* Quick Stats Grid */}
            <Grid templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={6} mb={10}>
              <Box bg="white" border="1px solid" borderColor="gray.200" p={6} borderRadius="xl" boxShadow="sm">
                <Flex justify="space-between" align="center" mb={4}>
                  <Text fontSize="sm" fontWeight="bold" color="gray.500">Active Loans</Text>
                  <Flex w="36px" h="36px" borderRadius="lg" bg="indigo.50" align="center" justify="center">
                    <Icon as={Activity} color="indigo.600" w="18px" h="18px" />
                  </Flex>
                </Flex>
                <Heading size="lg" fontWeight="extrabold" color="gray.900" fontSize="3xl" mb={1}>
                  {activeLoansCount} Active
                </Heading>
                <Text fontSize="xs" color="gray.400">
                  {pendingLoansCount} pending approval
                </Text>
              </Box>

              <Box bg="white" border="1px solid" borderColor="gray.200" p={6} borderRadius="xl" boxShadow="sm">
                <Flex justify="space-between" align="center" mb={4}>
                  <Text fontSize="sm" fontWeight="bold" color="gray.500">Total Interest Paid</Text>
                  <Flex w="36px" h="36px" borderRadius="lg" bg="pink.50" align="center" justify="center">
                    <Icon as={TrendingUp} color="pink.600" w="18px" h="18px" />
                  </Flex>
                </Flex>
                <Heading size="lg" fontWeight="extrabold" color="gray.900" fontSize="3xl" mb={1}>
                  {rupeeFormatter.format(aggregates.totalInterestPaid)}
                </Heading>
                <Text fontSize="xs" color="gray.400">
                  Calculated dynamically at runtime
                </Text>
              </Box>

              <Box bg="white" border="1px solid" borderColor="gray.200" p={6} borderRadius="xl" boxShadow="sm" gridColumn={{ sm: "span 2", lg: "span 1" }}>
                <Flex justify="space-between" align="center" mb={4}>
                  <Text fontSize="sm" fontWeight="bold" color="gray.500">Total Principal Paid</Text>
                  <Flex w="36px" h="36px" borderRadius="lg" bg="green.50" align="center" justify="center">
                    <Icon as={IndianRupee} color="green.600" w="18px" h="18px" />
                  </Flex>
                </Flex>
                <Heading size="lg" fontWeight="extrabold" color="gray.900" fontSize="3xl" mb={1}>
                  {rupeeFormatter.format(aggregates.totalPrincipalPaid)}
                </Heading>
                <Text fontSize="xs" color="gray.400">
                  Computed from elapsed tenure
                </Text>
              </Box>
            </Grid>

            <Box bg="white" border="1px solid" borderColor="gray.200" p={{ base: 4, sm: 6, lg: 8 }} borderRadius="xl" boxShadow="sm">
              <Flex justify="space-between" align="center" mb={6} direction={{ base: "column", sm: "row" }} gap={4}>
                <Box>
                  <Heading size="md" fontWeight="bold" color="gray.900" fontSize="xl" mb={1}>Recent Loan Activity</Heading>
                  <Text fontSize="xs" color="gray.500">List of active, pending, and paid loan application profiles.</Text>
                </Box>
                <Button 
                  onClick={() => { setSelectedLoan(null); setIsAddLoanOpen(true); }}
                  bgGradient="to-r" 
                  gradientFrom="indigo.600" 
                  gradientTo="purple.600" 
                  color="white" 
                  px={5} 
                  py={2} 
                  borderRadius="lg" 
                  _hover={{ bg: "indigo.700" }}
                  gap={2}
                  w={{ base: "100%", sm: "auto" }}
                >
                  <Plus size={16} /> New Loan
                </Button>
              </Flex>

              {/* Desktop Table View */}
              <Box display={{ base: "none", lg: "block" }} overflowX="auto">
                <Table.Root variant="line" size="md">
                  <Table.Header>
                    <Table.Row borderColor="gray.250">
                      <Table.ColumnHeader color="gray.500" borderColor="gray.200" py={5} px={6}>Loan Number</Table.ColumnHeader>
                      <Table.ColumnHeader color="gray.500" borderColor="gray.200" py={5} px={6}>Loan Type</Table.ColumnHeader>
                      <Table.ColumnHeader color="gray.500" borderColor="gray.200" py={5} px={6}>Principal</Table.ColumnHeader>
                      <Table.ColumnHeader color="gray.500" borderColor="gray.200" py={5} px={6}>Interest</Table.ColumnHeader>
                      <Table.ColumnHeader color="gray.500" borderColor="gray.200" py={5} px={6}>Term</Table.ColumnHeader>
                      <Table.ColumnHeader color="gray.500" borderColor="gray.200" py={5} px={6}>Start Date</Table.ColumnHeader>
                      <Table.ColumnHeader color="gray.500" borderColor="gray.200" py={5} px={6}>Status</Table.ColumnHeader>
                      <Table.ColumnHeader color="gray.500" borderColor="gray.200" py={5} px={6}>Actions</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {loansLoading ? (
                      <Table.Row borderColor="gray.100">
                        <Table.Cell colSpan={8} textAlign="center" py={12} color="gray.400" borderColor="transparent">
                          <Flex align="center" justify="center" gap={2}>
                            <Box 
                              w="18px" 
                              h="18px" 
                              border="2.5px solid rgba(99, 102, 241, 0.1)" 
                              borderTopColor="#6366f1" 
                              borderRadius="full" 
                              animation="spin 1s linear infinite" 
                            />
                            Loading loans...
                          </Flex>
                        </Table.Cell>
                      </Table.Row>
                    ) : loans.length === 0 ? (
                      <Table.Row borderColor="gray.100">
                        <Table.Cell colSpan={8} textAlign="center" py={12} color="gray.400" borderColor="transparent">
                          No active loans found. Click "New Loan" to create your first tracking profile.
                        </Table.Cell>
                      </Table.Row>
                    ) : (
                      loans.map((loan: Loan) => {
                        const statusColors = loan.status === 'Paid' 
                          ? { bg: 'rgba(16, 185, 129, 0.1)', color: '#059669' }
                          : loan.status === 'Active'
                          ? { bg: 'rgba(99, 102, 241, 0.1)', color: '#4f46e5' }
                          : { bg: 'rgba(245, 158, 11, 0.1)', color: '#d97706' };
                        
                        return (
                          <Table.Row key={loan.id} borderColor="gray.100">
                            <Table.Cell py={5} px={6} color="indigo.600" fontWeight="bold">{loan.loan_number}</Table.Cell>
                            <Table.Cell py={5} px={6} color="gray.850" fontWeight="semibold">{loan.loan_type}</Table.Cell>
                            <Table.Cell py={5} px={6} color="gray.800" fontWeight="medium">
                              {rupeeFormatter.format(loan.loan_amount)}
                            </Table.Cell>
                            <Table.Cell py={5} px={6}>{loan.roi}% ({loan.interest_type})</Table.Cell>
                            <Table.Cell py={5} px={6}>{loan.tenure} months</Table.Cell>
                            <Table.Cell py={5} px={6}>
                              {new Date(loan.installment_start_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                            </Table.Cell>
                            <Table.Cell py={5} px={6}>
                              <Flex 
                                as="span" 
                                bg={statusColors.bg} 
                                color={statusColors.color} 
                                px={3} 
                                py={1} 
                                borderRadius="full" 
                                fontSize="xs" 
                                fontWeight="bold"
                                align="center"
                                justify="center"
                                w="fit-content"
                              >
                                {loan.status}
                              </Flex>
                            </Table.Cell>
                            <Table.Cell py={5} px={6}>
                              <HStack gap={2}>
                                <Button 
                                  size="xs" 
                                  variant="ghost" 
                                  color="gray.600" 
                                  _hover={{ bg: "gray.100", color: "indigo.600" }} 
                                  onClick={() => { setSelectedLoan(loan); setIsAddLoanOpen(true); }}
                                  p={1.5}
                                  h="28px"
                                  w="28px"
                                  borderRadius="md"
                                >
                                  <Pencil size={14} />
                                </Button>
                                <Button 
                                  size="xs" 
                                  variant="ghost" 
                                  color="gray.400" 
                                  _hover={{ bg: "red.50", color: "red.600" }} 
                                  onClick={() => handleDeleteLoan(loan.id)}
                                  p={1.5}
                                  h="28px"
                                  w="28px"
                                  borderRadius="md"
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </HStack>
                            </Table.Cell>
                          </Table.Row>
                        );
                      })
                    )}
                  </Table.Body>
                </Table.Root>
              </Box>

              {/* Mobile/Tablet Card View */}
              <Box display={{ base: "block", lg: "none" }}>
                {loansLoading ? (
                  <Flex align="center" justify="center" py={8} color="gray.400" gap={2}>
                    <Box 
                      w="18px" 
                      h="18px" 
                      border="2.5px solid rgba(99, 102, 241, 0.1)" 
                      borderTopColor="#6366f1" 
                      borderRadius="full" 
                      animation="spin 1s linear infinite" 
                    />
                    Loading loans...
                  </Flex>
                ) : loans.length === 0 ? (
                  <Text textAlign="center" py={8} color="gray.400" fontSize="sm">
                    No active loans found. Click "New Loan" to create your first tracking profile.
                  </Text>
                ) : (
                  <VStack align="stretch" gap={4}>
                    {loans.map((loan: Loan) => {
                      const statusColors = loan.status === 'Paid' 
                        ? { bg: 'rgba(16, 185, 129, 0.1)', color: '#059669' }
                        : loan.status === 'Active'
                        ? { bg: 'rgba(99, 102, 241, 0.1)', color: '#4f46e5' }
                        : { bg: 'rgba(245, 158, 11, 0.1)', color: '#d97706' };
                      
                      return (
                        <Box 
                          key={loan.id}
                          bg="gray.50" 
                          border="1px solid" 
                          borderColor="gray.200" 
                          borderRadius="lg" 
                          p={4}
                          _hover={{ borderColor: "indigo.300", bg: "white" }}
                          transition="all 0.2s"
                        >
                          <Flex justify="space-between" align="center" mb={3}>
                            <Text color="indigo.600" fontWeight="bold" fontSize="sm">
                              {loan.loan_number}
                            </Text>
                            <Flex 
                              as="span" 
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
                          </Flex>

                          <Grid templateColumns="repeat(2, 1fr)" gap={3} fontSize="xs" mb={4}>
                            <Box>
                              <Text color="gray.400" fontWeight="semibold" mb={0.5}>LOAN TYPE</Text>
                              <Text color="gray.850" fontWeight="semibold">{loan.loan_type}</Text>
                            </Box>
                            <Box>
                              <Text color="gray.400" fontWeight="semibold" mb={0.5}>PRINCIPAL</Text>
                              <Text color="gray.800" fontWeight="bold">
                                {rupeeFormatter.format(loan.loan_amount)}
                              </Text>
                            </Box>
                            <Box>
                              <Text color="gray.400" fontWeight="semibold" mb={0.5}>TERM</Text>
                              <Text color="gray.700">{loan.tenure} months</Text>
                            </Box>
                            <Box>
                              <Text color="gray.400" fontWeight="semibold" mb={0.5}>INTEREST</Text>
                              <Text color="gray.700">{loan.roi}% ({loan.interest_type})</Text>
                            </Box>
                            <Box gridColumn="span 2">
                              <Text color="gray.400" fontWeight="semibold" mb={0.5}>START DATE</Text>
                              <Text color="gray.700">
                                {new Date(loan.installment_start_date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                              </Text>
                            </Box>
                          </Grid>

                          <Flex justify="flex-end" borderTop="1px solid" borderColor="gray.200" pt={3} gap={2}>
                            <Button 
                              size="xs" 
                              variant="outline" 
                              borderColor="gray.200"
                              color="gray.600" 
                              _hover={{ bg: "gray.100", color: "indigo.600" }} 
                              onClick={() => { setSelectedLoan(loan); setIsAddLoanOpen(true); }}
                              gap={1}
                              px={3}
                              h="28px"
                              borderRadius="md"
                            >
                              <Pencil size={12} /> Edit
                            </Button>
                            <Button 
                              size="xs" 
                              variant="outline" 
                              borderColor="gray.200"
                              color="gray.500" 
                              _hover={{ bg: "red.50", color: "red.600", borderColor: "red.100" }} 
                              onClick={() => handleDeleteLoan(loan.id)}
                              gap={1}
                              px={3}
                              h="28px"
                              borderRadius="md"
                            >
                              <Trash2 size={12} /> Delete
                            </Button>
                          </Flex>
                        </Box>
                      );
                    })}
                  </VStack>
                )}
              </Box>
            </Box>
          </>
        )}
      </Box>
      <AddLoanPanel 
        isOpen={isAddLoanOpen} 
        onClose={() => {
          setIsAddLoanOpen(false);
          setSelectedLoan(null);
        }} 
        customerId={user.id} 
        loan={selectedLoan}
        onLoanAdded={handleLoanSaved} 
      />
      <ReleaseNotesModal 
        isOpen={isReleaseModalOpen}
        onClose={handleCloseReleaseModal}
      />
    </Flex>
  );
}

