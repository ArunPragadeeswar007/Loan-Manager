import React from 'react';
import { 
  X, 
  Sparkles, 
  Shield, 
  User, 
  Briefcase, 
  Calculator, 
  Smartphone 
} from 'lucide-react';
import { 
  Box, 
  Flex, 
  Heading, 
  Text, 
  Button, 
  VStack, 
  HStack 
} from '@chakra-ui/react';

interface ReleaseFeature {
  title: string;
  category: string;
  icon: React.ComponentType<any>;
  iconColor: string;
  iconBg: string;
  badgeBg: string;
  badgeColor: string;
  description: string;
  bullets: string[];
}

interface ReleaseNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CURRENT_RELEASE_VERSION = '1.0.0';
const RELEASE_DATE = 'June 5, 2026';

const FEATURES: ReleaseFeature[] = [
  {
    title: 'Secure Google OAuth',
    category: 'Security',
    icon: Shield,
    iconColor: '#2563eb', // Blue
    iconBg: 'blue.50',
    badgeBg: 'rgba(37, 99, 235, 0.1)',
    badgeColor: 'blue.700',
    description: 'Enterprise-grade authentication with automatic relational profile synchronization.',
    bullets: [
      'Protected routes and secure Supabase token handling.',
      'Auto-generation of profile data in database upon Google sign-in.'
    ]
  },
  {
    title: 'Profile Dashboard',
    category: 'User Experience',
    icon: User,
    iconColor: '#7c3aed', // Purple
    iconBg: 'purple.50',
    badgeBg: 'rgba(124, 58, 237, 0.1)',
    badgeColor: 'purple.700',
    description: 'Personalized user space to customize contact info and profile imagery.',
    bullets: [
      'Manage full name, synced email, and contact details.',
      'Dynamic initials fallback generator for missing profile avatars.'
    ]
  },
  {
    title: 'Loan Tracking (CRUD)',
    category: 'Feature',
    icon: Briefcase,
    iconColor: '#4f46e5', // Indigo
    iconBg: 'indigo.50',
    badgeBg: 'rgba(79, 70, 229, 0.1)',
    badgeColor: 'indigo.700',
    description: 'Comprehensive tracker for managing the complete lifecycle of loan agreements.',
    bullets: [
      'Toggle between Home, Car, Personal, Business, and Education loans.',
      'Track interest types, annual ROI, installment schedules, and status values.'
    ]
  },
  {
    title: 'Runtime Calculations',
    category: 'Utility',
    icon: Calculator,
    iconColor: '#059669', // Emerald/Green
    iconBg: 'green.50',
    badgeBg: 'rgba(5, 150, 105, 0.1)',
    badgeColor: 'green.700',
    description: 'Mathematical engines computing financial summaries dynamically on load.',
    bullets: [
      'Computes paid principal and interest in real-time based on elapsed tenure.',
      'Rupee-to-words Indian currency converter (e.g. Lakhs/Crores) and month-to-year reader.'
    ]
  },
  {
    title: 'Responsive Optimization',
    category: 'Interface',
    icon: Smartphone,
    iconColor: '#db2777', // Pink
    iconBg: 'pink.50',
    badgeBg: 'rgba(219, 39, 119, 0.1)',
    badgeColor: 'pink.700',
    description: 'Fully refactored UI structure for fluid adaptation across all viewports.',
    bullets: [
      'Sticky headers and interactive slide-in drawers for mobile layout.',
      'Optimized touch-friendly data card stacks replacing dense tables on small screens.'
    ]
  }
];

export function ReleaseNotesModal({ isOpen, onClose }: ReleaseNotesModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Light Glassmorphic Backdrop */}
      <Box 
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="blackAlpha.600"
        backdropFilter="blur(4px)"
        zIndex={9999}
        onClick={onClose}
        transition="opacity 0.3s ease"
      />

      {/* Premium Light Theme Modal Box */}
      <Box 
        position="fixed"
        top="50%"
        left="50%"
        transform="translate(-50%, -50%)"
        width={{ base: "92%", sm: "85%", md: "580px" }}
        maxHeight="90vh"
        bg="white"
        border="1px solid"
        borderColor="gray.200"
        borderRadius="2xl"
        boxShadow="2xl"
        zIndex={10000}
        display="flex"
        flexDirection="column"
        overflow="hidden"
        style={{
          animation: 'modalScaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}
      >
        {/* CSS Keyframes for smooth entrance and custom scrollbar */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes modalScaleIn {
            from {
              opacity: 0;
              transform: translate(-50%, -45%) scale(0.95);
            }
            to {
              opacity: 1;
              transform: translate(-50%, -50%) scale(1);
            }
          }
          
          /* Custom sleek scrollbar for release content */
          .release-content::-webkit-scrollbar {
            width: 6px;
          }
          .release-content::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.02);
            border-radius: 10px;
          }
          .release-content::-webkit-scrollbar-thumb {
            background: rgba(79, 70, 229, 0.2);
            border-radius: 10px;
          }
          .release-content::-webkit-scrollbar-thumb:hover {
            background: rgba(79, 70, 229, 0.4);
          }
        `}} />

        {/* Modal Header */}
        <Flex 
          justify="space-between" 
          align="flex-start" 
          p={{ base: 6, md: 8 }} 
          pb={4}
          borderBottom="1px solid"
          borderColor="gray.100"
        >
          <VStack align="flex-start" gap={1.5}>
            {/* Version Badge */}
            <HStack 
              bg="indigo.50" 
              border="1px solid"
              borderColor="indigo.100"
              px={3} 
              py={1} 
              borderRadius="full" 
              gap={1.5}
            >
              <Sparkles size={12} color="#4f46e5" />
              <Text 
                fontSize="10px" 
                fontWeight="extrabold" 
                color="indigo.700" 
                letterSpacing="0.05em"
                textTransform="uppercase"
              >
                Version {CURRENT_RELEASE_VERSION}
              </Text>
            </HStack>

            <Heading 
              size="md" 
              fontWeight="extrabold" 
              color="gray.900" 
              fontSize={{ base: "xl", md: "2xl" }}
              letterSpacing="-0.02em"
              mt={1}
            >
              What's New in LoanManager
            </Heading>
            <Text fontSize="xs" color="gray.500">
              Released on {RELEASE_DATE} &bull; Stable Production Build
            </Text>
          </VStack>

          {/* Close Button */}
          <Button 
            onClick={onClose} 
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

        {/* Scrollable Features List */}
        <Box 
          className="release-content"
          flex={1} 
          overflowY="auto" 
          px={{ base: 6, md: 8 }} 
          py={6}
          maxHeight={{ base: "45vh", md: "380px" }}
        >
          <VStack align="stretch" gap={6}>
            {FEATURES.map((feature, idx) => {
              const IconComp = feature.icon;
              return (
                <Flex key={idx} gap={4} align="flex-start">
                  {/* Category Circular Icon Container */}
                  <Flex 
                    align="center" 
                    justify="center" 
                    boxSize="42px" 
                    borderRadius="full" 
                    bg={feature.iconBg} 
                    border="1px solid"
                    borderColor="transparent"
                    style={{ flexShrink: 0 }}
                  >
                    <IconComp size={20} color={feature.iconColor} />
                  </Flex>

                  {/* Feature Content */}
                  <VStack align="flex-start" gap={1} flex={1}>
                    <HStack justify="space-between" w="100%">
                      <Text fontWeight="bold" color="gray.900" fontSize="sm">
                        {feature.title}
                      </Text>
                      <Text 
                        fontSize="9px" 
                        fontWeight="extrabold" 
                        color={feature.badgeColor} 
                        bg={feature.badgeBg}
                        px={2}
                        py={0.5}
                        borderRadius="full"
                        letterSpacing="0.05em"
                        textTransform="uppercase"
                      >
                        {feature.category}
                      </Text>
                    </HStack>
                    <Text fontSize="xs" color="gray.600" lineHeight="1.4">
                      {feature.description}
                    </Text>
                    
                    {/* Bullet Points */}
                    <VStack align="stretch" gap={1} mt={1} pl={2} borderLeft="2px solid" borderColor="gray.100">
                      {feature.bullets.map((bullet, bIdx) => (
                        <Text key={bIdx} fontSize="11px" color="gray.500" display="flex" gap={1.5} alignItems="center">
                          <span style={{ color: feature.iconColor }}>&bull;</span>
                          {bullet}
                        </Text>
                      ))}
                    </VStack>
                  </VStack>
                </Flex>
              );
            })}
          </VStack>
        </Box>

        {/* Modal Footer / Action */}
        <Box 
          p={{ base: 6, md: 8 }} 
          borderTop="1px solid"
          borderColor="gray.100"
          bg="gray.50"
        >
          <Button
            onClick={onClose}
            bgGradient="to-r"
            gradientFrom="indigo.600"
            gradientTo="purple.600"
            color="white"
            _hover={{ 
              bg: "indigo.700",
              boxShadow: "0 4px 12px rgba(79, 70, 229, 0.2)"
            }}
            w="100%"
            py={6}
            borderRadius="lg"
            fontWeight="bold"
            fontSize="sm"
            letterSpacing="0.02em"
            border="none"
            cursor="pointer"
            transition="all 0.2s"
          >
            Got It, Let's Explore!
          </Button>
        </Box>
      </Box>
    </>
  );
}
