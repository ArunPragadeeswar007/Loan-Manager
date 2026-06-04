import React, { useState } from 'react';
import { updateProfile, type Profile } from '../supabase';
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  Save, 
  CheckCircle, 
  AlertTriangle, 
  Image as ImageIcon, 
  ArrowLeft 
} from 'lucide-react';
import { 
  Box, 
  Flex, 
  Grid, 
  GridItem, 
  Heading, 
  Text, 
  Button, 
  Input, 
  Image, 
  VStack, 
  HStack 
} from '@chakra-ui/react';

interface ProfilePageProps {
  user: any;
  profile: Profile | null;
  onProfileUpdated: (updatedProfile: Profile) => void;
  onBack: () => void;
}

export function ProfilePage({ user, profile, onProfileUpdated, onBack }: ProfilePageProps) {
  const [fullName, setFullName] = useState(profile?.full_name || user?.user_metadata?.full_name || '');
  const [email, setEmail] = useState(profile?.email || user?.email || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || user?.user_metadata?.avatar_url || '');
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Full Name is required.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const userId = user.id;
      const updates = {
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        avatar_url: avatarUrl.trim() || null,
      };

      const updated = await updateProfile(userId, updates);
      if (updated) {
        onProfileUpdated(updated);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box maxW="1000px" mx="auto" py={6} px={{ base: 4, sm: 6, lg: 0 }} className="animate-fade-in">
      {/* Header section */}
      <Box mb={8}>
        <Button 
          onClick={onBack} 
          variant="outline" 
          borderColor="gray.200" 
          color="gray.700" 
          _hover={{ bg: "gray.50", color: "gray.900" }} 
          mb={6}
          gap={2}
          size="sm"
          boxShadow="sm"
          bg="white"
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </Button>
        <Heading size="lg" fontWeight="extrabold" color="gray.950" fontSize={{ base: "2xl", sm: "3xl" }} letterSpacing="-0.02em" mb={1}>
          Manage Profile
        </Heading>
        <Text fontSize="sm" color="gray.500">View and update your personal identification details.</Text>
      </Box>

      {/* Profile details grid */}
      <Grid templateColumns={{ base: "1fr", lg: "1fr 2fr" }} gap={8} alignItems="start">
        {/* Left Side: Avatar Card */}
        <GridItem>
          <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" p={8} textAlign="center" boxShadow="sm">
            <Flex justify="center" mb={6}>
              {avatarUrl ? (
                <Image 
                  src={avatarUrl} 
                  alt="Avatar Preview" 
                  borderRadius="full" 
                  boxSize="120px" 
                  border="4px solid" 
                  borderColor="indigo.500" 
                  objectFit="cover"
                  onError={() => setAvatarUrl('')} 
                />
              ) : (
                <Flex 
                  borderRadius="full" 
                  boxSize="120px" 
                  bgGradient="to-tr" 
                  gradientFrom="indigo.500" 
                  gradientTo="purple.500" 
                  align="center" 
                  justify="center" 
                  fontWeight="extrabold" 
                  color="white"
                  fontSize="3.5rem"
                >
                  {(fullName[0] || user?.email?.[0] || 'U').toUpperCase()}
                </Flex>
              )}
            </Flex>
            
            <Heading size="md" color="gray.900" fontSize="xl" mb={1}>{fullName || 'User Profile'}</Heading>
            <Text fontSize="xs" fontWeight="bold" color="indigo.600" letterSpacing="0.05em" textTransform="uppercase" mb={6}>
              Client Account / Admin
            </Text>

            <VStack align="stretch" gap={3} pt={5} borderTop="1px solid" borderColor="gray.200">
              <Flex justify="space-between" fontSize="xs">
                <Text color="gray.500">Account ID:</Text>
                <Text color="gray.700" fontWeight="semibold" title={user.id}>{user.id.slice(0, 12)}...</Text>
              </Flex>
              <Flex justify="space-between" fontSize="xs">
                <Text color="gray.500">Joined:</Text>
                <Text color="gray.700" fontWeight="semibold">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Today'}
                </Text>
              </Flex>
            </VStack>
          </Box>
        </GridItem>

        {/* Right Side: Profile edit form */}
        <GridItem>
          <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="xl" p={{ base: 5, sm: 8, md: 10 }} boxShadow="sm">
            <Heading size="md" fontWeight="bold" color="gray.900" fontSize="xl" mb={6}>
              Edit Personal Details
            </Heading>

            {error && (
              <Flex align="center" gap={3} bg="red.50" border="1px solid" borderColor="red.200" color="red.800" p={4} borderRadius="xl" mb={6}>
                <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                <Text fontSize="sm">{error}</Text>
              </Flex>
            )}

            {success && (
              <Flex align="center" gap={3} bg="green.50" border="1px solid" borderColor="green.200" color="green.300" p={4} borderRadius="xl" mb={6}>
                <CheckCircle size={18} style={{ flexShrink: 0 }} />
                <Text fontSize="sm">Profile changes saved successfully! Your account headers have been updated.</Text>
              </Flex>
            )}

            <form onSubmit={handleSubmit}>
              <VStack align="stretch" gap={5}>
                <Box>
                  <HStack mb={2} color="gray.600" fontSize="xs" fontWeight="bold" gap={2}>
                    <UserIcon size={14} color="#8b5cf6" />
                    <Text>FULL NAME</Text>
                  </HStack>
                  <Input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jane Doe"
                    bg="gray.50"
                    borderColor="gray.250"
                    color="gray.850"
                    py={6}
                    _focus={{ borderColor: "indigo.500", bg: "white" }}
                    required
                  />
                </Box>

                <Box>
                  <HStack mb={2} color="gray.600" fontSize="xs" fontWeight="bold" gap={2}>
                    <Mail size={14} color="#4f46e5" />
                    <Text>EMAIL ADDRESS</Text>
                  </HStack>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane.doe@example.com"
                    bg="gray.50"
                    borderColor="gray.250"
                    color="gray.850"
                    py={6}
                    _focus={{ borderColor: "indigo.500", bg: "white" }}
                    required
                  />
                </Box>

                <Box>
                  <HStack mb={2} color="gray.600" fontSize="xs" fontWeight="bold" gap={2}>
                    <Phone size={14} color="#059669" />
                    <Text>PHONE NUMBER</Text>
                  </HStack>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 019-2834"
                    bg="gray.50"
                    borderColor="gray.250"
                    color="gray.850"
                    py={6}
                    _focus={{ borderColor: "indigo.500", bg: "white" }}
                  />
                </Box>

                <Box>
                  <HStack mb={2} color="gray.600" fontSize="xs" fontWeight="bold" gap={2}>
                    <ImageIcon size={14} color="#e11d48" />
                    <Text>AVATAR IMAGE URL</Text>
                  </HStack>
                  <Input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    bg="gray.50"
                    borderColor="gray.250"
                    color="gray.850"
                    py={6}
                    _focus={{ borderColor: "indigo.500", bg: "white" }}
                  />
                </Box>

                <Button 
                  type="submit" 
                  disabled={loading} 
                  bgGradient="to-r" 
                  gradientFrom="indigo.600" 
                  gradientTo="purple.600" 
                  color="white" 
                  w="100%" 
                  py={6} 
                  mt={2}
                  borderRadius="lg" 
                  _hover={{ bg: "indigo.700" }}
                  gap={2}
                >
                  {loading ? (
                    <Flex align="center" gap={2}>
                      <Box 
                        w="16px" 
                        h="16px" 
                        border="2px solid" 
                        borderColor="whiteAlpha.300" 
                        borderTopColor="white" 
                        borderRadius="full" 
                        animation="spin 1s linear infinite" 
                      />
                      Saving details...
                    </Flex>
                  ) : (
                    <>
                      <Save size={18} /> Save Profile Details
                    </>
                  )}
                </Button>
              </VStack>
            </form>
          </Box>
        </GridItem>
      </Grid>
    </Box>
  );
}
