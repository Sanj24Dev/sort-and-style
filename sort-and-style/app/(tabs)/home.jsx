import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TextInput,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  SafeAreaView,
  Animated,
  Alert,
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

const this_page = 'search';
const logoImgUrl = 'https://i.imgur.com/TVNYMQB.png';
const API_URL = 'http://10.0.0.104:3000';

const tabs = [
  { id: 'search', name: 'Search', route: '/(tabs)/home' },
  { id: 'outfits', name: 'Outfits', route: '/(tabs)/outfit' },
  { id: 'lists', name: 'Lists', route: '/(tabs)/lists' },
];

const App = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState(this_page);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [profileVisible, setProfileVisible] = useState(false);
  const [userName, setUserName] = useState('');
  const [pfpUrl, setPfpUrl] = useState('');
  const [userId, setId] = useState('');


  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);

  // Calculate the offset where search bar should stick
  // This is the height of header + tabs + search label and spacing
  const HEADER_HEIGHT = screenHeight * 0.2 + SPACING.lg + SPACING.md;
  const TABS_HEIGHT = 44 + SPACING.md * 2; // tab height + padding
  const SEARCH_LABEL_HEIGHT = FONT_SIZES.md + SPACING.xs + SPACING.md; // label + margin + top padding
  const STICKY_OFFSET = HEADER_HEIGHT + TABS_HEIGHT + SEARCH_LABEL_HEIGHT;

  const fetchItems = (url) => {
    fetch(url)
      .then(res => res.json())
      .then(data => {
        // console.log("From [HomeScreen]:", data);
        if (!Array.isArray(data)) throw new Error("Data is not an array");

        setResults(data);
        setLoading(false);

        const categoryMap = {};
        data.forEach(item => {
          const cat = item.category?.toLowerCase();
          if (cat && !categoryMap[cat]) {
            categoryMap[cat] = item.imageUrl;
          }
        });

        const dynamicCategories = [
          { id: 'all', name: 'All', url: logoImgUrl },
          ...Object.entries(categoryMap).map(([id, url]) => ({
            id,
            name: id.charAt(0).toUpperCase() + id.slice(1),
            url,
          }))
        ];

        setCategories(dynamicCategories);
      })
      .catch(err => {
        console.error("From [HomeScreen]:", 'Failed to fetch items:', err);
        setLoading(false);
      });
  };


  const getUserInfo = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        console.log("From [HomeScreen]:", "Logged in user: ", user.name);
        console.log("From [HomeScreen]:", "Logged in id: ", user.userId);
        console.log("From [HomeScreen]:", "Logged in pfp: ", user.pfp);
        setUserName(user.name);
        setPfpUrl(user.pfp);
        setId(user.userId);
        const ITEMS_API_URL = `${API_URL}/items?userId=${user.userId}`;
        console.log("From [HomeScreen], url search: ", ITEMS_API_URL);
        await fetchItems(ITEMS_API_URL);
      }
    } catch (e) {
      console.error("From [HomeScreen]:", 'Error reading user:', e);
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
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleTabPress = (tab) => {
    router.push(tab.route);
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false }
  );

  // Calculate sticky search bar visibility
  const stickySearchOpacity = scrollY.interpolate({
    inputRange: [STICKY_OFFSET - 20, STICKY_OFFSET],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });


  const openModal = (item) => {
    console.log("From [HomeScreen]:", 'Opening modal for:', item.name);
    setSelectedItem(item);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedItem(null);
  };


  const handleDelete = async (id) => {
    try {
      const deleteURL = `${API_URL}/items/${id}?userId=${userId}`;
      const response = await fetch(deleteURL, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        const ITEMS_API_URL = `${API_URL}/items?userId=${userId}`;
        console.log("From [HomeScreen], url search: ", ITEMS_API_URL);
        await fetchItems(ITEMS_API_URL);
      } else {
        throw new Error(data.error || 'Delete failed');
      }
    } catch (error) {
      console.error("From [HomeScreen]:", 'Delete error:', error);
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
      <Animated.View
        style={[
          baseStyles.stickySearchContainer,
          { opacity: stickySearchOpacity }
        ]}
        pointerEvents={scrollY._value >= STICKY_OFFSET ? 'auto' : 'none'}
      >
        <TextInput
          style={baseStyles.stickySearchBar}
          placeholder="Type to search"
          placeholderTextColor={COLORS.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </Animated.View>

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

        {/* Search Section */}
        <View style={baseStyles.searchSection}>
          <TextInput
            style={baseStyles.searchBar}
            placeholder="Type to search"
            placeholderTextColor={COLORS.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
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

        {/* Search Results */}
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
                {searchQuery ? `No items found for "${searchQuery}"` : 'No items found.'}
              </Text>
              <Text style={baseStyles.emptyStateSubtext}>Try adjusting your search or category filter</Text>
            </View>
          ) : (
            <View style={styles.gridContainer}>
              {filteredResults.map((item) => (
                <View key={item._id} style={styles.gridItem}>
                  <TouchableOpacity style={styles.resultItem} onPress={() => openModal(item)}>
                    <Image
                      source={{ uri: item.imageUrl }}
                      style={styles.resultImage}
                      onError={(e) => console.log('Image failed to load', item.imageUrl)}
                    />
                    <Text style={styles.resultName} numberOfLines={2}>{item.name}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={closeModal}
        >
          <View style={styles.itemModalOverlay}>
            <View style={styles.itemModalContainer}>
              {selectedItem && (
                <>
                  <Image
                    source={{ uri: selectedItem.imageUrl }}
                    style={styles.itemModalImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.itemModalTitle}>{selectedItem.name}</Text>
                  <View style={styles.itemModalActions}>

                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => {
                        // Navigate to edit page with selected item data
                        router.push({
                          pathname: '/(tabs)/add_item',
                          params: { name: selectedItem.name, category: selectedItem.category, imageUrl: selectedItem.imageUrl, id: selectedItem._id }
                        });
                        closeModal();
                      }}
                    >
                      <Text style={styles.editButtonText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => {
                        Alert.alert(
                          'Confirm Delete',
                          'Are you sure you want to delete this item?',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'Delete',
                              style: 'destructive',
                              onPress: async () => {
                                await handleDelete(selectedItem._id);
                                closeModal();
                              },
                            },
                          ],
                        );
                      }}
                    >
                      <Text style={styles.deleteButtonText}>Delete</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                    <Text style={styles.closeButtonText}>Close</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>


        {/* Bottom spacing */}
        <View style={baseStyles.bottomSpacing} />
      </Animated.ScrollView>
    </SafeAreaView >
  );
};

export default App;

const styles = StyleSheet.create({
  results: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.white,
    minHeight: screenHeight * 0.5,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: (screenWidth - SPACING.lg * 3) / 2,
    marginBottom: SPACING.lg,
  },
  resultItem: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.sm,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultImage: {
    width: '100%',
    height: (screenWidth - SPACING.lg * 3) / 2,
    borderRadius: 8,
    marginBottom: SPACING.xs,
  },
  resultName: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.black,
    textAlign: 'center',
  },



  itemModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemModalContainer: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  itemModalImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 15,
  },
  itemModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  itemModalActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  editButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 10,
    marginRight: 10,
  },
  editButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 10,
    marginLeft: 10,
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  closeButton: {
    marginTop: 15,
  },
  closeButtonText: {
    color: '#666',
  },
});