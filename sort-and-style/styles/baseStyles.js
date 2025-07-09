// commonStyles.js
import { StyleSheet, Dimensions } from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from '../constants/themes';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const baseStyles = StyleSheet.create({
    // home page
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    stickySearchContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.white,
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.sm,
        paddingBottom: SPACING.sm,
        zIndex: 1000,
        shadowColor: COLORS.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 8,
    },
    stickySearchBar: {
        height: 44,
        backgroundColor: COLORS.white,
        borderRadius: 22,
        paddingHorizontal: SPACING.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
        fontSize: FONT_SIZES.md,
    },
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    // header in home page
    topBanner: {
        backgroundColor: COLORS.secondary,
        height: screenHeight * 0.2,
        width: '100%',
    },
    // header: {
    //     width: '100%',
    // },
    profileButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 10,
        marginTop: 10,
    },
    profileButtonText: {
        textAlign: 'center',
        paddingVertical: 5,
        color: COLORS.white,
    },
    profileModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileModal: {
        position: 'absolute',
        // right: 20,
        backgroundColor: COLORS.white,
        padding: 15,
        borderRadius: 10,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        zIndex: 999,
        width: '70%',
    },
    profileHeader: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pfp: {
        width: screenWidth * 0.40,
        height: screenWidth * 0.40,
        borderRadius: screenWidth * 0.20,
        borderColor: COLORS.primary,
        borderWidth: 2,
        // marginRight: SPACING.md,
        backgroundColor: COLORS.white,
    },
    name: {
        fontSize: FONT_SIZES.xl,
        fontWeight: 'bold',
        color: COLORS.black,
        marginVertical: 10,
    },
    logoutButton: {
        padding: 10,
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        marginVertical: 5,
    },
    logoutButtonText: {
        color: COLORS.white,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    deleteButton: {
        padding: 10,
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        marginVertical: 5,
    },
    deleteButtonText: {
        color: COLORS.white,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    closeButton: {
        padding: 10,
        // backgroundColor: '#007bff',
        // borderRadius: 8,
        marginVertical: 5,
    },
    closeButtonText: {
        color: COLORS.lightGray,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    header: {
        flexDirection: 'row',
        marginTop: -SPACING.xxxl,
        paddingHorizontal: SPACING.lg,
        zIndex: 1,
    },
    avatar: {
        width: screenWidth * 0.40,
        height: screenWidth * 0.40,
        borderRadius: screenWidth * 0.20,
        borderColor: COLORS.primary,
        borderWidth: 2,
        marginRight: SPACING.md,
        backgroundColor: COLORS.white,
    },
    greeting: {
        fontSize: FONT_SIZES.xl,
        fontWeight: 'bold',
        color: COLORS.black,
        marginTop: 60,
        marginLeft: SPACING.sm,
        textAlign: 'center',
    },

    // tabs in home page
    tabs: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: SPACING.md,
        backgroundColor: COLORS.white,
    },
    tab: {
        backgroundColor: COLORS.background,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.xl,
        borderRadius: 20,
        minWidth: screenWidth * 0.25,
        alignItems: 'center',
    },
    tabActive: {
        backgroundColor: COLORS.primary,
    },
    tabText: {
        color: COLORS.primary,
        fontWeight: '500',
        fontSize: FONT_SIZES.sm,
    },
    tabTextActive: {
        color: COLORS.white,
        fontWeight: '600',
    },

    // search bar in home page
    searchSection: {
        paddingHorizontal: SPACING.lg,
        paddingTop: SPACING.md,
        backgroundColor: COLORS.white,
    },
    searchBar: {
        height: 44,
        backgroundColor: COLORS.white,
        borderRadius: 22,
        paddingHorizontal: SPACING.lg,
        marginBottom: SPACING.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        fontSize: FONT_SIZES.md,
    },

    //categories in home page
    categoryContainer: {
        paddingHorizontal: SPACING.lg,
        marginBottom: SPACING.xxxl,
    },
    categoryItem: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.white,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: SPACING.sm,
        borderWidth: 5,
        borderColor: COLORS.lightGray,
    },
    categoryItemActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    categoryImage: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: COLORS.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 26,
    },
    categoryText: {
        color: COLORS.primary,
        fontSize: FONT_SIZES.sm,
        fontWeight: '500',
        marginTop: SPACING.sm,
    },

    // empty state home page
    emptyStateContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: screenHeight * 0.1,
    },
    emptyStateIcon: {
        fontSize: FONT_SIZES.xxxl * 2,
        marginBottom: SPACING.lg,
        color: COLORS.secondary,
    },
    emptyState: {
        textAlign: 'center',
        color: COLORS.primary,
        fontSize: FONT_SIZES.lg,
        fontWeight: '600',
        marginBottom: SPACING.xs,
    },
    emptyStateSubtext: {
        textAlign: 'center',
        color: COLORS.primary,
        fontSize: FONT_SIZES.sm,
        opacity: 0.7,
    },
    bottomSpacing: {
        height: 100,
        backgroundColor: COLORS.white,
    },
});