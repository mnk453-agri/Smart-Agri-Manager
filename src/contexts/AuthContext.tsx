import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth } from '../services/firebase'
import {
  completeUserProfile,
  createWorkspaceForOwner,
  getOrganization,
  getUserAccount,
  getUserMemberships,
  loginUser,
  logoutUser,
  registerAccount,
} from '../services/authService'
import type {
  ActiveWorkspace,
  CompleteProfileInput,
  CreateWorkspaceInput,
  LoginInput,
  Organization,
  OrganizationMembership,
  RegisterAccountInput,
  UserAccount,
} from '../types/auth'

type AuthContextValue = {
  firebaseUser: User | null
  userAccount: UserAccount | null
  memberships: OrganizationMembership[]
  organizations: Organization[]
  activeWorkspace: ActiveWorkspace | null
  isLoading: boolean
  register: (input: RegisterAccountInput) => Promise<void>
  completeProfile: (input: CompleteProfileInput) => Promise<void>
  createWorkspace: (input: CreateWorkspaceInput) => Promise<void>
  login: (input: LoginInput) => Promise<void>
  logout: () => Promise<void>
  switchWorkspace: (organizationId: string) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
)

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null)
  const [userAccount, setUserAccount] =
    useState<UserAccount | null>(null)
  const [memberships, setMemberships] = useState<
    OrganizationMembership[]
  >([])
  const [organizations, setOrganizations] = useState<Organization[]>(
    [],
  )
  const [activeWorkspace, setActiveWorkspace] =
    useState<ActiveWorkspace | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadAuthenticatedUser = async (user: User) => {
    const account = await getUserAccount(user.uid)
    const userMemberships = await getUserMemberships(user.uid)

    const loadedOrganizations = (
      await Promise.all(
        userMemberships.map((membership) =>
          getOrganization(membership.organizationId),
        ),
      )
    ).filter(
      (organization): organization is Organization =>
        organization !== null,
    )

    setUserAccount(account)
    setMemberships(userMemberships)
    setOrganizations(loadedOrganizations)

    const savedWorkspaceId = localStorage.getItem(
      'smartAgriActiveWorkspaceId',
    )

    const selectedMembership =
      userMemberships.find(
        (membership) =>
          membership.organizationId === savedWorkspaceId,
      ) ?? userMemberships[0]

    if (!selectedMembership) {
      setActiveWorkspace(null)
      return
    }

    const selectedOrganization = loadedOrganizations.find(
      (organization) =>
        organization.id === selectedMembership.organizationId,
    )

    if (!selectedOrganization) {
      setActiveWorkspace(null)
      return
    }

    setActiveWorkspace({
      organization: selectedOrganization,
      membership: selectedMembership,
    })

    localStorage.setItem(
      'smartAgriActiveWorkspaceId',
      selectedOrganization.id,
    )
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        try {
          setIsLoading(true)
          setFirebaseUser(user)

          if (!user) {
            setUserAccount(null)
            setMemberships([])
            setOrganizations([])
            setActiveWorkspace(null)
            return
          }

          await loadAuthenticatedUser(user)
        } catch (error) {
          console.error(
            'Unable to load authenticated user:',
            error,
          )

          setUserAccount(null)
          setMemberships([])
          setOrganizations([])
          setActiveWorkspace(null)
        } finally {
          setIsLoading(false)
        }
      },
    )

    return unsubscribe
  }, [])

  const register = async (input: RegisterAccountInput) => {
    await registerAccount(input)
  }

  const completeProfile = async (
    input: CompleteProfileInput,
  ) => {
    if (!firebaseUser) {
      throw new Error(
        'A signed-in user is required to complete a profile.',
      )
    }

    await completeUserProfile(firebaseUser.uid, input)

    const existingMemberships = await getUserMemberships(
      firebaseUser.uid,
    )

    if (existingMemberships.length === 0) {
      const enteredBusinessName =
        input.agricultureBusinessName.trim()

      const automaticBusinessName =
        `${input.fullName.trim()} Agriculture`

      const workspaceResult = await createWorkspaceForOwner(
        firebaseUser.uid,
        {
          organizationName:
            enteredBusinessName || automaticBusinessName,
          defaultLanguage: input.preferredLanguage,
        },
      )

      localStorage.setItem(
        'smartAgriActiveWorkspaceId',
        workspaceResult.organizationId,
      )
    }

    await loadAuthenticatedUser(firebaseUser)
  }

  const createWorkspace = async (
    input: CreateWorkspaceInput,
  ) => {
    if (!firebaseUser) {
      throw new Error(
        'A signed-in user is required to create a workspace.',
      )
    }

    const result = await createWorkspaceForOwner(
      firebaseUser.uid,
      input,
    )

    localStorage.setItem(
      'smartAgriActiveWorkspaceId',
      result.organizationId,
    )

    await loadAuthenticatedUser(firebaseUser)
  }

  const login = async (input: LoginInput) => {
    await loginUser(input)
  }

  const logout = async () => {
    await logoutUser()
    localStorage.removeItem('smartAgriActiveWorkspaceId')
  }

  const switchWorkspace = (organizationId: string) => {
    const membership = memberships.find(
      (item) => item.organizationId === organizationId,
    )

    const organization = organizations.find(
      (item) => item.id === organizationId,
    )

    if (!membership || !organization) {
      return
    }

    setActiveWorkspace({
      organization,
      membership,
    })

    localStorage.setItem(
      'smartAgriActiveWorkspaceId',
      organizationId,
    )
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      firebaseUser,
      userAccount,
      memberships,
      organizations,
      activeWorkspace,
      isLoading,
      register,
      completeProfile,
      createWorkspace,
      login,
      logout,
      switchWorkspace,
    }),
    [
      firebaseUser,
      userAccount,
      memberships,
      organizations,
      activeWorkspace,
      isLoading,
    ],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth must be used inside an AuthProvider.',
    )
  }

  return context
}