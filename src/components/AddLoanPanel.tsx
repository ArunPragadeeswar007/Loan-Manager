import React, { useState, useEffect } from 'react';
import { createLoan, updateLoan, type Loan } from '../supabase';
import { 
  X, 
  Hash, 
  Tag, 
  IndianRupee, 
  Calendar, 
  CalendarRange, 
  TrendingUp, 
  Percent, 
  AlertTriangle,
  Plus,
  Activity
} from 'lucide-react';
import { parseDate } from '@internationalized/date';
import { 
  Box, 
  Flex, 
  Heading, 
  Text, 
  Button, 
  Input, 
  VStack, 
  HStack,
  DatePicker,
  Portal,
  NativeSelectRoot,
  NativeSelectField
} from '@chakra-ui/react';

// Helper: Convert total months into years and months
const formatMonthsToReadable = (totalMonthsStr: string): string => {
  const totalMonths = Number(totalMonthsStr);
  if (isNaN(totalMonths) || totalMonths <= 0) return '';
  
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  
  const yearText = years > 0 ? `${years} year${years === 1 ? '' : 's'}` : '';
  const monthText = months > 0 ? `${months} month${months === 1 ? '' : 's'}` : '';
  
  if (yearText && monthText) {
    return `${yearText} ${monthText}`;
  }
  return yearText || monthText || '';
};

// Helper: Convert numeric string of amount into words (Indian numbering system)
const numberToWordsIndian = (numStr: string): string => {
  const num = Number(numStr);
  if (isNaN(num) || num <= 0) return '';
  if (num === 0) return 'Zero Rupees';

  const singleDigits = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const doubleDigits = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tensMultiple = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const convertLessThanThousand = (n: number): string => {
    let str = "";
    if (n >= 100) {
      str += singleDigits[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n > 0) {
      if (str !== "") str += "and ";
      if (n < 10) {
        str += singleDigits[n];
      } else if (n < 20) {
        str += doubleDigits[n - 10];
      } else {
        str += tensMultiple[Math.floor(n / 10)] + (n % 10 > 0 ? "-" + singleDigits[n % 10] : "");
      }
    }
    return str.trim();
  };

  let n = Math.floor(num);
  let result = "";

  if (n >= 10000000) {
    const crores = Math.floor(n / 10000000);
    result += convertLessThanThousand(crores) + " Crore ";
    n %= 10000000;
  }
  if (n >= 100000) {
    const lakhs = Math.floor(n / 100000);
    result += convertLessThanThousand(lakhs) + " Lakh ";
    n %= 100000;
  }
  if (n >= 1000) {
    const thousands = Math.floor(n / 1000);
    result += convertLessThanThousand(thousands) + " Thousand ";
    n %= 1000;
  }
  if (n > 0) {
    result += convertLessThanThousand(n);
  }

  return result.trim() ? `${result.trim()} Rupees Only` : '';
};

interface AddLoanPanelProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string; // The logged in user profile ID
  onLoanAdded: (loan: Loan) => void;
  loan?: Loan | null;
}

export function AddLoanPanel({ isOpen, onClose, customerId, onLoanAdded, loan }: AddLoanPanelProps) {
  const [loanNumber, setLoanNumber] = useState('');
  const [loanType, setLoanType] = useState('Home');
  const [loanAmount, setLoanAmount] = useState('');
  const [tenure, setTenure] = useState('');
  const [startDate, setStartDate] = useState('');
  const [interestType, setInterestType] = useState<'Fixed' | 'Floating'>('Fixed');
  const [roi, setRoi] = useState('');
  const [status, setStatus] = useState<'Active' | 'Pending' | 'Paid'>('Active');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state with current loan edit model
  useEffect(() => {
    if (loan) {
      setLoanNumber(loan.loan_number);
      setLoanType(loan.loan_type);
      setLoanAmount(loan.loan_amount.toString());
      setTenure(loan.tenure.toString());
      setStartDate(loan.installment_start_date);
      setInterestType(loan.interest_type);
      setRoi(loan.roi.toString());
      setStatus(loan.status);
    } else {
      setLoanNumber('');
      setLoanType('Home');
      setLoanAmount('');
      setTenure('');
      setStartDate('');
      setInterestType('Fixed');
      setRoi('');
      setStatus('Active');
    }
    setError(null);
  }, [loan, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    if (!loanNumber.trim()) return setError('Loan Number is required.');
    if (!loanAmount || Number(loanAmount) <= 0) return setError('Loan Amount must be greater than 0.');
    if (!tenure || Number(tenure) <= 0) return setError('Tenure must be greater than 0 months.');
    if (!startDate) return setError('Installment Start Date is required.');
    if (!roi || Number(roi) < 0) return setError('ROI cannot be negative.');

    try {
      setLoading(true);
      setError(null);

      const loanData = {
        customer_id: customerId,
        loan_number: loanNumber.trim(),
        loan_type: loanType,
        loan_amount: Number(loanAmount),
        tenure: Math.round(Number(tenure)),
        installment_start_date: startDate,
        interest_type: interestType,
        roi: Number(roi),
        status: status
      };

      let savedLoan: Loan;
      if (loan) {
        savedLoan = await updateLoan(loan.id, loanData);
      } else {
        savedLoan = await createLoan(loanData);
      }

      onLoanAdded(savedLoan);
      onClose();
    } catch (err: any) {
      if (err.message && err.message.includes('unique_loan_number_per_customer')) {
        setError('A loan with this Loan Number already exists.');
      } else {
        setError(err.message || 'An error occurred while saving the loan.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <Box 
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg="blackAlpha.600"
        backdropFilter="blur(4px)"
        zIndex={999}
        onClick={onClose}
        transition="opacity 0.2s"
      />

      {/* Slide-out Panel */}
      <Box 
        position="fixed"
        top={0}
        right={0}
        height="100vh"
        width={{ base: "100%", md: "460px" }}
        bg="white"
        boxShadow="2xl"
        zIndex={1000}
        display="flex"
        flexDirection="column"
        className="animate-slide-in"
        style={{
          animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
        }}
      >
        {/* Style tag for slide-in animation */}
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes slideIn {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
          }
        `}} />

        {/* Panel Header */}
        <Flex 
          justify="space-between" 
          align="center" 
          p={{ base: 4, sm: 6 }} 
          borderBottom="1px solid" 
          borderColor="gray.150"
        >
          <Box>
            <Heading size="md" fontWeight="extrabold" color="gray.950" fontSize="xl" mb={1}>
              {loan ? 'Edit Loan Agreement' : 'Add New Loan'}
            </Heading>
            <Text fontSize="xs" color="gray.500">
              {loan ? 'Modify existing loan parameters and payment progress.' : 'Create a new loan entry in your tracker portfolio.'}
            </Text>
          </Box>
          <Button 
            onClick={onClose} 
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
        </Flex>

        {/* Panel Body / Form */}
        <Box 
          flex={1} 
          overflowY="auto" 
          p={{ base: 4, sm: 6 }}
        >
          {error && (
            <Flex 
              align="center" 
              gap={3} 
              bg="red.50" 
              border="1px solid" 
              borderColor="red.200" 
              color="red.800" 
              p={4} 
              borderRadius="xl" 
              mb={6}
            >
              <AlertTriangle size={18} style={{ flexShrink: 0 }} />
              <Text fontSize="sm">{error}</Text>
            </Flex>
          )}

          <form onSubmit={handleSubmit}>
            <VStack align="stretch" gap={5}>
              
              {/* Loan Number */}
              <Box>
                <HStack mb={2} color="gray.600" fontSize="xs" fontWeight="bold" gap={2}>
                  <Hash size={14} color="#8b5cf6" />
                  <Text>LOAN NUMBER</Text>
                </HStack>
                <Input
                  type="text"
                  value={loanNumber}
                  onChange={(e) => setLoanNumber(e.target.value)}
                  placeholder="e.g. LN-89754"
                  bg="gray.50"
                  borderColor="gray.250"
                  color="gray.850"
                  h="48px"
                  px={4}
                  _focus={{ borderColor: "indigo.500", bg: "white" }}
                  required
                />
              </Box>

              {/* Loan Type */}
              <Box>
                <HStack mb={2} color="gray.600" fontSize="xs" fontWeight="bold" gap={2}>
                  <Tag size={14} color="#4f46e5" />
                  <Text>LOAN TYPE</Text>
                </HStack>
                <NativeSelectRoot w="100%">
                  <NativeSelectField
                    value={loanType}
                    onChange={(e: any) => setLoanType(e.target.value)}
                    bg="gray.50"
                    border="1px solid"
                    borderColor="gray.250"
                    color="gray.850"
                    borderRadius="md"
                    px={4}
                    h="48px"
                    fontSize="sm"
                    outline="none"
                    _focus={{ borderColor: "indigo.500", bg: "white" }}
                  >
                    <option value="Home">Home Loan</option>
                    <option value="Car">Car Loan</option>
                    <option value="Insurance">Insurance Loan</option>
                    <option value="Personal">Personal Loan</option>
                    <option value="Education">Education Loan</option>
                    <option value="Business">Business Loan</option>
                    <option value="Other">Other</option>
                  </NativeSelectField>
                </NativeSelectRoot>
              </Box>

              {/* Loan Amount */}
              <Box>
                <HStack mb={2} color="gray.600" fontSize="xs" fontWeight="bold" gap={2}>
                  <IndianRupee size={14} color="#059669" />
                  <Text>LOAN AMOUNT (INR)</Text>
                </HStack>
                <Input
                  type="number"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  placeholder="e.g. 50000"
                  bg="gray.50"
                  borderColor="gray.250"
                  color="gray.850"
                  h="48px"
                  px={4}
                  min={1}
                  _focus={{ borderColor: "indigo.500", bg: "white" }}
                  required
                />
                {loanAmount && (
                  <Text fontSize="xs" color="indigo.600" fontWeight="semibold" mt={1.5} pl={1}>
                    {numberToWordsIndian(loanAmount)}
                  </Text>
                )}
              </Box>

              {/* Tenure */}
              <Box>
                <HStack mb={2} color="gray.600" fontSize="xs" fontWeight="bold" gap={2}>
                  <Calendar size={14} color="#ea580c" />
                  <Text>TENURE (MONTHS)</Text>
                </HStack>
                <Input
                  type="number"
                  value={tenure}
                  onChange={(e) => setTenure(e.target.value)}
                  placeholder="e.g. 24"
                  bg="gray.50"
                  borderColor="gray.250"
                  color="gray.850"
                  h="48px"
                  px={4}
                  min={1}
                  _focus={{ borderColor: "indigo.500", bg: "white" }}
                  required
                />
                {tenure && (
                  <Text fontSize="xs" color="indigo.600" fontWeight="semibold" mt={1.5} pl={1}>
                    {formatMonthsToReadable(tenure)}
                  </Text>
                )}
              </Box>

              {/* Installment Start Date */}
              <Box position="relative">
                <HStack mb={2} color="gray.600" fontSize="xs" fontWeight="bold" gap={2}>
                  <CalendarRange size={14} color="#2563eb" />
                  <Text>INSTALLMENT START DATE</Text>
                </HStack>
                <DatePicker.Root
                  value={startDate ? [parseDate(startDate)] : []}
                  onValueChange={(details) => {
                    if (details.value && details.value.length > 0) {
                      setStartDate(details.value[0].toString());
                    } else {
                      setStartDate('');
                    }
                  }}
                >
                  <DatePicker.Control position="relative" display="flex" w="100%">
                    <DatePicker.Input
                      placeholder="Select Date"
                      bg="gray.50"
                      borderColor="gray.250"
                      color="gray.850"
                      h="48px"
                      w="100%"
                      fontSize="sm"
                      px={4}
                      borderRadius="md"
                      _focus={{ borderColor: "indigo.500", bg: "white" }}
                      required
                    />
                    <DatePicker.Trigger
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#6B7280',
                        zIndex: 2
                      }}
                    >
                      <CalendarRange size={16} />
                    </DatePicker.Trigger>
                  </DatePicker.Control>
                  <Portal>
                    <DatePicker.Positioner zIndex={1100}>
                      <DatePicker.Content
                        bg="white"
                        border="1px solid"
                        borderColor="gray.200"
                        borderRadius="md"
                        boxShadow="lg"
                        p={4}
                      >
                        <DatePicker.View view="day">
                          <DatePicker.Header />
                          <DatePicker.DayTable />
                        </DatePicker.View>
                        <DatePicker.View view="month">
                          <DatePicker.Header />
                          <DatePicker.MonthTable />
                        </DatePicker.View>
                        <DatePicker.View view="year">
                          <DatePicker.Header />
                          <DatePicker.YearTable />
                        </DatePicker.View>
                      </DatePicker.Content>
                    </DatePicker.Positioner>
                  </Portal>
                </DatePicker.Root>
              </Box>

              {/* Interest Type */}
              <Box>
                <HStack mb={2} color="gray.600" fontSize="xs" fontWeight="bold" gap={2}>
                  <TrendingUp size={14} color="#db2777" />
                  <Text>INTEREST TYPE</Text>
                </HStack>
                <NativeSelectRoot w="100%">
                  <NativeSelectField
                    value={interestType}
                    onChange={(e: any) => setInterestType(e.target.value)}
                    bg="gray.50"
                    border="1px solid"
                    borderColor="gray.250"
                    color="gray.850"
                    borderRadius="md"
                    px={4}
                    h="48px"
                    fontSize="sm"
                    outline="none"
                    _focus={{ borderColor: "indigo.500", bg: "white" }}
                  >
                    <option value="Fixed">Fixed Rate</option>
                    <option value="Floating">Floating Rate</option>
                  </NativeSelectField>
                </NativeSelectRoot>
              </Box>

              {/* ROI */}
              <Box>
                <HStack mb={2} color="gray.600" fontSize="xs" fontWeight="bold" gap={2}>
                  <Percent size={14} color="#0d9488" />
                  <Text>RATE OF INTEREST (ROI % ANNUALLY)</Text>
                </HStack>
                <Input
                  type="number"
                  step="0.01"
                  value={roi}
                  onChange={(e) => setRoi(e.target.value)}
                  placeholder="e.g. 7.25"
                  bg="gray.50"
                  borderColor="gray.250"
                  color="gray.850"
                  h="48px"
                  px={4}
                  min={0}
                  _focus={{ borderColor: "indigo.500", bg: "white" }}
                  required
                />
              </Box>

              {/* Loan Status */}
              <Box>
                <HStack mb={2} color="gray.600" fontSize="xs" fontWeight="bold" gap={2}>
                  <Activity size={14} color="#059669" />
                  <Text>LOAN STATUS</Text>
                </HStack>
                <NativeSelectRoot w="100%">
                  <NativeSelectField
                    value={status}
                    onChange={(e: any) => setStatus(e.target.value as any)}
                    bg="gray.50"
                    border="1px solid"
                    borderColor="gray.250"
                    color="gray.850"
                    borderRadius="md"
                    px={4}
                    h="48px"
                    fontSize="sm"
                    outline="none"
                    _focus={{ borderColor: "indigo.500", bg: "white" }}
                  >
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                  </NativeSelectField>
                </NativeSelectRoot>
              </Box>
            </VStack>

            {/* Form Actions */}
            <Flex gap={3} mt={8} borderTop="1px solid" borderColor="gray.100" pt={6} direction={{ base: "column-reverse", sm: "row" }}>
              <Button
                variant="outline"
                borderColor="gray.200"
                color="gray.700"
                _hover={{ bg: "gray.50" }}
                onClick={onClose}
                w="100%"
                py={6}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                bgGradient="to-r"
                gradientFrom="indigo.600"
                gradientTo="purple.600"
                color="white"
                _hover={{ bg: "indigo.700" }}
                w="100%"
                py={6}
                gap={2}
              >
                {loading ? (
                  <Flex align="center" gap={2} justify="center">
                    <Box 
                      w="16px" 
                      h="16px" 
                      border="2px solid" 
                      borderColor="whiteAlpha.300" 
                      borderTopColor="white" 
                      borderRadius="full" 
                      animation="spin 1s linear infinite" 
                    />
                    {loan ? 'Updating Loan...' : 'Saving Loan...'}
                  </Flex>
                ) : (
                  <>
                    <Plus size={18} /> {loan ? 'Update Loan' : 'Save Loan'}
                  </>
                )}
              </Button>
            </Flex>
          </form>
        </Box>
      </Box>
    </>
  );
}
