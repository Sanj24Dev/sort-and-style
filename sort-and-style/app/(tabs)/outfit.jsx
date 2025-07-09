import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  SafeAreaView,
  Animated,
  Alert,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import iconImg from '@/assets/images/icon.png';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

import { COLORS, SPACING, FONT_SIZES } from '../../constants/themes';
import { baseStyles } from '../../styles/baseStyles';

const this_page = 'outfits';

const tabs = [
  { id: 'search', name: 'Search', route: '/(tabs)/home' },
  { id: 'outfits', name: 'Outfits', route: '/(tabs)/outfit' },
  { id: 'lists', name: 'Lists', route: '/(tabs)/lists' },
];

const imageSize = (screenWidth - SPACING.lg * 8);

const App = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState(this_page);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeIndices, setActiveIndices] = useState({});

  const itemScroll = (event, outfitId) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / imageSize);

    setActiveIndices((prev) => ({
      ...prev,
      [outfitId]: newIndex,
    }));
  };

  const [profileVisible, setProfileVisible] = useState(false);
  const [userName, setUserName] = useState('');
  const [pfpUrl, setPfpUrl] = useState('');
  const [userId, setId] = useState('');

  const router = useRouter();

  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);

  // Calculate the offset where search bar should stick
  // This is the height of header + tabs + search label and spacing
  const HEADER_HEIGHT = screenHeight * 0.2 + SPACING.lg + SPACING.md;
  const TABS_HEIGHT = 44 + SPACING.md * 2; // tab height + padding
  const SEARCH_LABEL_HEIGHT = FONT_SIZES.md + SPACING.xs + SPACING.md; // label + margin + top padding
  const STICKY_OFFSET = HEADER_HEIGHT + TABS_HEIGHT + SEARCH_LABEL_HEIGHT;

  const API_URL = 'http://10.0.0.104:3000';

  const fetchItems = async (items_url, outfits_url) => {
    try {
      const [outfitsRes, itemsRes] = await Promise.all([
        fetch(outfits_url),
        fetch(items_url)
      ]);

      const outfits = await outfitsRes.json();
      const items = await itemsRes.json();

      if (!Array.isArray(outfits) || !Array.isArray(items)) {
        console.error('Unexpected format:', { outfits, items });
        throw new Error('Invalid data format from server');
      }

      const itemMap = {};
      items.forEach(it => {
        itemMap[it._id] = it;
      });

      const enrichedOutfits = outfits.map(outfit => ({
        ...outfit,
        items: outfit.items.map(itemId => itemMap[itemId]).filter(Boolean)
      }));

      setResults(enrichedOutfits);
      setLoading(false);

      const categoryMap = {};
      enrichedOutfits.forEach(item => {
        const cat = item.category?.toLowerCase();
        if (cat && !categoryMap[cat] && item.items[0]) {
          categoryMap[cat] = item.items[0].imageUrl;
        }
      });

      const dynamicCategories = [
        { id: 'all', name: 'All', url: 'https://i.imgur.com/TVNYMQB.png' },
        ...Object.entries(categoryMap).map(([id, url]) => ({
          id,
          name: id.charAt(0).toUpperCase() + id.slice(1),
          url,
        }))
      ];

      setCategories(dynamicCategories);
      getUserInfo();

    } catch (err) {
      console.error("From [OutfitScreen]:", 'Failed to fetch outfits/items:', err);
      setLoading(false);
    }
  };


  const getUserInfo = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        // console.log("From [OutfitScreen]:", "Logged in user: ", user.name);
        // console.log("From [OutfitScreen]:", "Logged in id: ", user.userId);
        // console.log("From [OutfitScreen]:", "Logged in pfp: ", user.pfp);
        setUserName(user.name);
        setPfpUrl(user.pfp);
        setId(user.userId);
        const ITEMS_API_URL = `${API_URL}/items?userId=${user.userId}`;
        const OUTFITS_API_URL = `${API_URL}/outfits?userId=${user.userId}`;
        // console.log("From [OutfitScreen], url search: ", ITEMS_API_URL);
        await fetchItems(ITEMS_API_URL, OUTFITS_API_URL);
      }
    } catch (e) {
      console.error("From [OutfitScreen]:", 'Error reading user:', e);
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      getUserInfo(); // now getUserInfo will handle fetching items
    }, [])
  );



  // Filter results based on search query and category
  const filteredResults = results.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category?.toLowerCase() === selectedCategory;
    return matchesCategory;
  });

  const handleTabPress = (tab) => {
    router.push(tab.route);
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  );

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://10.0.0.104:3000/outfits/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        getUserInfo();
      } else {
        throw new Error(data.error || 'Delete failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
      Alert.alert('Error', error.message);
    }
  };

  const renderTabItem = (tab) => (
    <TouchableOpacity
      key={tab.id}
      style={[baseStyles.tab, activeTab === tab.id && baseStyles.tabActive]}
      onPress={() => handleTabPress(tab)}
    >
      <Text style={[
        baseStyles.tabText,
        activeTab === tab.id && baseStyles.tabTextActive
      ]}>
        {tab.name}
      </Text>
    </TouchableOpacity>
  );

  const handleLogoutAccount = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      await AsyncStorage.clear();
      if (userStr) {
        const user = JSON.parse(userStr);
        console.log("From [HomeScreen]:", "Logging out: ", user.name);
        AsyncStorage.removeItem('user');
        setProfileVisible(false);
        setUserName(null);
        setPfpUrl(null);
        setId(null);
        setResults([]);
        setCategories([]);
        router.replace('/');
      } else {
        setLoading(false); // Only show startup screen if no token
      }
    } catch (err) {
      console.error("From [HomeScreen]:", 'Failed to fetch items:', err);
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const res = await fetch(`${API_URL}/users/${userId}`, {
        method: 'DELETE',
      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.error || 'Unknown error');

      console.log('Account deleted:', result);
      setProfileVisible(false);
      await AsyncStorage.clear();
      router.replace('/');
    } catch (err) {
      console.error('Failed to delete account:', err);
      Alert.alert('Error', 'Could not delete your account. Please try again.');
    }
  };

  return (
    <SafeAreaView style={baseStyles.container}>
      {/* Main Scrollable Content */}
      <Animated.ScrollView
        ref={scrollViewRef}
        style={baseStyles.scrollContainer}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={baseStyles.scrollContent}
      >
        {/* Header */}
        <View>
          <View style={baseStyles.topBanner} />
          <View style={baseStyles.header}>
            <Image source={{ uri: pfpUrl }} style={baseStyles.avatar} />
            <View style={{ flex: 'column', width: '50%' }}>
              <Text style={baseStyles.greeting}>Hi {userName}!</Text>
              <TouchableOpacity style={baseStyles.profileButton} onPress={() => setProfileVisible(true)}>
                <Text style={baseStyles.profileButtonText}>Profile</Text>
              </TouchableOpacity>
              <Modal
                animationType="slide"
                transparent={true}
                visible={profileVisible}
              >
                <View style={baseStyles.profileModalOverlay}>
                  {
                    profileVisible && (
                      <>
                        <View style={baseStyles.profileModal}>
                          <View style={baseStyles.profileHeader}>
                            <Image source={{ uri: pfpUrl }} style={baseStyles.pfp} />
                            <Text style={baseStyles.name}>{userName}</Text>
                          </View>
                          <TouchableOpacity style={baseStyles.logoutButton} onPress={() => handleLogoutAccount()}>
                            <Text style={baseStyles.logoutButtonText}>Logout</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={baseStyles.deleteButton} onPress={() => {
                            Alert.alert(
                              'Confirm Delete',
                              'Are you sure you want to delete this account?',
                              [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                  text: 'Delete',
                                  style: 'destructive',
                                  onPress: async () => {
                                    await handleDeleteAccount();
                                  },
                                },
                              ],
                            );
                          }}>
                            <Text style={baseStyles.deleteButtonText}>Delete Account</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={baseStyles.closeButton} onPress={() => setProfileVisible(false)}>
                            <Text style={baseStyles.closeButtonText}>Close</Text>
                          </TouchableOpacity>
                        </View>
                      </>
                    )
                  }
                </View>
              </Modal>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={baseStyles.tabs}>
          {tabs.map(renderTabItem)}
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={baseStyles.categoryScroll}
          contentContainerStyle={baseStyles.categoryContainer}
        >
          {categories.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                baseStyles.categoryItem,
                selectedCategory === item.id && baseStyles.categoryItemActive
              ]}
              onPress={() => setSelectedCategory(item.id)}
            >
              <View style={[
                baseStyles.categoryCircle,
                selectedCategory === item.id && baseStyles.categoryCircleActive
              ]}>
                <Image
                  source={{ uri: item.url }}
                  style={baseStyles.categoryImage}
                />
              </View>
              <Text style={[
                baseStyles.categoryText
              ]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Results */}
        <View style={styles.results}>
          {loading ? (
            <View style={baseStyles.emptyStateContainer}>
              <MaterialIcons name="hourglass-empty" size={48} style={baseStyles.emptyStateIcon} />
              <Text style={baseStyles.emptyState}>Loading items...</Text>
            </View>
          ) : filteredResults.length === 0 ? (
            <View style={baseStyles.emptyStateContainer}>
              <MaterialIcons name="search" size={48} style={baseStyles.emptyStateIcon} />
              <Text style={baseStyles.emptyState}>
                No items found.
              </Text>
              <Text style={baseStyles.emptyStateSubtext}>Try adjusting category filter</Text>
            </View>
          ) : (
            <ScrollView contentContainerStyle={styles.gridContainer}>
              {filteredResults.map((item) => (
                <View key={item._id} style={styles.gridItem}>
                  <View style={styles.resultItem}>
                    {/* Image carousel */}
                    <ScrollView
                      horizontal
                      onScroll={(e) => itemScroll(e, item._id)}
                      pagingEnabled
                      showsHorizontalScrollIndicator={false}
                      style={styles.carouselContainer}
                    >
                      {item.items.map((subItem, index) => (
                        <Image
                          key={index}
                          source={{ uri: subItem.imageUrl }}
                          style={styles.carouselImage}
                          onError={() => console.log('Failed to load', subItem.imageUrl)}
                        />
                      ))}
                    </ScrollView>

                    {/* Pagination Dots */}
                    <View style={styles.pagination}>
                      {item.items.map((_, index) => (
                        <View
                          key={index}
                          style={[
                            styles.dot,
                            index === (activeIndices[item._id] || 0) ? styles.activeDot : styles.inactiveDot,
                          ]}
                        />
                      ))}
                    </View>

                    {/* Bottom row: category + delete */}
                    <View style={styles.itemBottomRow}>
                      <Text style={styles.categoryText}>{item.category}</Text>
                      <View style={styles.itemActions}>
                        <TouchableOpacity
                          onPress={() => {
                            // Navigate to edit page with selected item data
                            router.push({
                              pathname: '/(tabs)/add_outfit',
                              params: { category: item.category, items: item.items.map(it => it._id), id: item._id },
                            });
                          }}
                          style={styles.editButton}
                        >
                          <MaterialIcons name="edit" size={24} color={COLORS.border} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() =>
                            Alert.alert('Confirm Delete', 'Are you sure you want to delete this outfit?', [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Delete',
                                style: 'destructive',
                                onPress: () => handleDelete(item._id),
                              },
                            ])
                          }
                          style={styles.deleteButton}
                        >
                          <MaterialIcons name="delete" size={24} color={COLORS.border} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>




        {/* Bottom spacing */}
        <View style={baseStyles.bottomSpacing} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

export default App;

const styles = StyleSheet.create({
  results: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.white,
    // minHeight: screenHeight * 0.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: SPACING.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridItem: {
    width: screenWidth - 0.3 * screenWidth,
    marginBottom: SPACING.lg,
  },
  resultItem: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.sm,
    minHeight: screenHeight * 0.35,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultImage: {
    width: imageSize,
    height: imageSize,
    borderRadius: 8,
    marginBottom: SPACING.xs,
  },
  resultName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.black,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  modalImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  closeButton: {
    marginTop: 15,
  },
  closeButtonText: {
    color: '#666',
  },
  carouselContainer: {
    height: imageSize,
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10,
  },
  carouselImage: {
    width: imageSize, // same width as grid item
    height: imageSize,
    resizeMode: 'cover',
    borderRadius: 12,
    marginRight: 6,
  },
  itemBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  categoryText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'flex-end'
  },
  editButton: {
    marginRight: 5,
  },
  deleteButton: {
    marginLeft: 10,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: COLORS.primary,
  },
  inactiveDot: {
    backgroundColor: '#ccc',
  },
});