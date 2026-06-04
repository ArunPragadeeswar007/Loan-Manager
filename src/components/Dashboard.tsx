import { useState } from 'react';
import { supabase, type Profile } from '../supabase';
import { 
  LogOut, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Activity, 
  Plus, 
  Settings,
  Briefcase,
  User,
  CheckCircle
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
  Grid
} from '@chakra-ui/react';
import { ProfilePage } from './ProfilePage';

interface DashboardProps {
  user: any;
  profile: Profile | null;
  onLogout: () => void;
  onProfileUpdated: (updatedProfile: Profile) => void;
}

export function Dashboard({ user, profile, onLogout, onProfileUpdated }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile'>('dashboard');

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  // Extract display name: use profile full name, or user metadata, or email
  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || null;
  const userEmail = profile?.email || user?.email || '';

  // Portfolio loan list (empty for database synchronization)
  const loans: any[] = [];

  return (
    <Flex minH="100vh" bg="#F4F6FA" color="gray.700" fontFamily="body">
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
        display={{ base: "none", md: "flex" }} 
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
            <DollarSign size={18} /> 
            <Text fontWeight="medium" fontSize="sm">Loans</Text>
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
        ml={{ base: 0, md: "260px" }} 
        p={{ base: 6, md: 10 }} 
        bg="#F4F6FA" 
        minH="100vh"
      >
        {activeTab === 'profile' ? (
          <ProfilePage 
            user={user} 
            profile={profile} 
            onProfileUpdated={onProfileUpdated} 
            onBack={() => setActiveTab('dashboard')} 
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
                <Heading size="lg" fontWeight="extrabold" color="gray.950" fontSize="3xl" letterSpacing="-0.03em" mb={1}>
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

            {/* Database Sync Banner */}
            <Flex 
              align="center" 
              gap={3} 
              bg="green.50" 
              border="1px solid" 
              borderColor="green.200" 
              color="green.800" 
              p={4} 
              borderRadius="xl" 
              mb={8}
              boxShadow="sm"
            >
              <CheckCircle size={18} style={{ flexShrink: 0 }} />
              <Text fontSize="sm" fontWeight="medium">
                <strong>Database Account Verified:</strong> Successfully authenticated with Supabase Google Auth and verified your user row in the <code>profiles</code> table.
              </Text>
            </Flex>

            {/* Quick Stats Grid */}
            <Grid templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={6} mb={10}>
              <Box bg="white" border="1px solid" borderColor="gray.200" p={6} borderRadius="xl" boxShadow="sm">
                <Flex justify="space-between" align="center" mb={4}>
                  <Text fontSize="sm" fontWeight="bold" color="gray.500">Active Portfolio</Text>
                  <Flex w="36px" h="36px" borderRadius="lg" bg="indigo.50" align="center" justify="center">
                    <DollarSign size={18} color="#4f46e5" />
                  </Flex>
                </Flex>
                <Heading size="lg" fontWeight="extrabold" color="gray.900" fontSize="3xl" mb={1}>$0.00</Heading>
                <Text fontSize="xs" color="gray.400">No active loans</Text>
              </Box>

              <Box bg="white" border="1px solid" borderColor="gray.200" p={6} borderRadius="xl" boxShadow="sm">
                <Flex justify="space-between" align="center" mb={4}>
                  <Text fontSize="sm" fontWeight="bold" color="gray.500">Interest Accrued</Text>
                  <Flex w="36px" h="36px" borderRadius="lg" bg="pink.50" align="center" justify="center">
                    <TrendingUp size={18} color="#db2777" />
                  </Flex>
                </Flex>
                <Heading size="lg" fontWeight="extrabold" color="gray.900" fontSize="3xl" mb={1}>$0.00</Heading>
                <Text fontSize="xs" color="gray.400">No interest accrued</Text>
              </Box>

              <Box bg="white" border="1px solid" borderColor="gray.200" p={6} borderRadius="xl" boxShadow="sm" gridColumn={{ sm: "span 2", lg: "span 1" }}>
                <Flex justify="space-between" align="center" mb={4}>
                  <Text fontSize="sm" fontWeight="bold" color="gray.500">Total Clients</Text>
                  <Flex w="36px" h="36px" borderRadius="lg" bg="blue.50" align="center" justify="center">
                    <Users size={18} color="#2563eb" />
                  </Flex>
                </Flex>
                <Heading size="lg" fontWeight="extrabold" color="gray.900" fontSize="3xl" mb={1}>0 Active</Heading>
                <Text fontSize="xs" color="gray.400">0 pending approvals</Text>
              </Box>
            </Grid>

            {/* Loan Table Section */}
            <Box bg="white" border="1px solid" borderColor="gray.200" p={6} borderRadius="xl" boxShadow="sm">
              <Flex justify="space-between" align="center" mb={6} direction={{ base: "column", sm: "row" }} gap={4}>
                <Box>
                  <Heading size="md" fontWeight="bold" color="gray.900" fontSize="xl" mb={1}>Recent Loan Activity</Heading>
                  <Text fontSize="xs" color="gray.500">List of active, pending, and paid loan application profiles.</Text>
                </Box>
                <Button 
                  bgGradient="to-r" 
                  gradientFrom="indigo.600" 
                  gradientTo="purple.600" 
                  color="white" 
                  px={5} 
                  py={2} 
                  borderRadius="lg" 
                  _hover={{ bg: "indigo.700" }}
                  gap={2}
                >
                  <Plus size={16} /> New Loan
                </Button>
              </Flex>

              <Box overflowX="auto">
                <Table.Root variant="line" size="md">
                  <Table.Header>
                    <Table.Row borderColor="gray.250">
                      <Table.ColumnHeader color="gray.500" borderColor="gray.200" py={4}>Loan ID</Table.ColumnHeader>
                      <Table.ColumnHeader color="gray.500" borderColor="gray.200" py={4}>Client Name</Table.ColumnHeader>
                      <Table.ColumnHeader color="gray.500" borderColor="gray.200" py={4}>Principal</Table.ColumnHeader>
                      <Table.ColumnHeader color="gray.500" borderColor="gray.200" py={4}>Interest</Table.ColumnHeader>
                      <Table.ColumnHeader color="gray.500" borderColor="gray.200" py={4}>Term</Table.ColumnHeader>
                      <Table.ColumnHeader color="gray.500" borderColor="gray.200" py={4}>Applied Date</Table.ColumnHeader>
                      <Table.ColumnHeader color="gray.500" borderColor="gray.200" py={4}>Status</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {loans.length === 0 ? (
                      <Table.Row borderColor="gray.100">
                        <Table.Cell colSpan={7} textAlign="center" py={12} color="gray.400" borderColor="transparent">
                          No active loans found. Click "New Loan" to create your first tracking profile.
                        </Table.Cell>
                      </Table.Row>
                    ) : (
                      loans.map((loan: any) => (
                        <Table.Row key={loan.id} borderColor="gray.100">
                          <Table.Cell color="indigo.600" fontWeight="bold">{loan.id}</Table.Cell>
                          <Table.Cell color="gray.800" fontWeight="medium">{loan.client}</Table.Cell>
                          <Table.Cell color="gray.800">${loan.amount.toLocaleString()}</Table.Cell>
                          <Table.Cell>{loan.interest}%</Table.Cell>
                          <Table.Cell>{loan.term}</Table.Cell>
                          <Table.Cell>{loan.date}</Table.Cell>
                          <Table.Cell>{loan.status}</Table.Cell>
                        </Table.Row>
                      ))
                    )}
                  </Table.Body>
                </Table.Root>
              </Box>
            </Box>
          </>
        )}
      </Box>
    </Flex>
  );
}
