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

const this_page = 'lists';

const tabs = [
  { id: 'search', name: 'Search', route: '/(tabs)/home' },
  { id: 'outfits', name: 'Outfits', route: '/(tabs)/outfit' },
  { id: 'lists', name: 'Lists', route: '/(tabs)/lists' },
];

const App = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedList, setSelectedList] = useState(null);
  const [selectedListItems, setSelectedListItems] = useState([]);
  // const [selectedItems, setSelectedItems] = useState([]);
  const [allItems, setAllItems] = useState([]);
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

  const API_URL = 'http://10.0.0.104:3000';

  const fetchItems = async (items_url, lists_url) => {
    try {
      const [listsRes, itemsRes] = await Promise.all([
        fetch(lists_url),
        fetch(items_url)
      ]);

      const lists = await listsRes.json();
      const items = await itemsRes.json();


      if (!Array.isArray(lists) || !Array.isArray(items)) {
        console.error('Unexpected format:', { outfits, items });
        throw new Error('Invalid data format from server');
      }
      setAllItems(items);
      setResults(lists);

      setLoading(false);

    } catch (err) {
      console.error("From [ListScreen]:", 'Failed to fetch lists/items:', err);
      setLoading(false);
    }
  };


  const getUserInfo = async () => {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserName(user.name);
        setPfpUrl(user.pfp);
        setId(user.userId);
        const ITEMS_API_URL = `${API_URL}/items?userId=${user.userId}`;
        const LISTS_API_URL = `${API_URL}/lists?userId=${user.userId}`;
        await fetchItems(ITEMS_API_URL, LISTS_API_URL);
      }
    } catch (e) {
      console.error("From [ListScreen]:", 'Error reading user:', e);
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
    const matchesSearch = item.name?.toLowerCase().includes(searchQuery?.toLowerCase());
    // const matchesCategory = selectedCategory === 'all' || item.category?.toLowerCase() === selectedCategory;
    return matchesSearch;
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


  const openModal = (list) => {
    setSelectedList(list);

    const idCheckedMap = new Map(
      list.items.map(([id, checked]) => [id.toString(), checked])
    );

    const filtered = allItems
      .filter(item => idCheckedMap.has(item._id.toString()))
      .map(item => ({
        ...item,
        checked: idCheckedMap.get(item._id.toString())
      }));

    setSelectedListItems(filtered);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedList(null);
    setSelectedListItems(null);
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

  const handleSave = async () => {
    try {
      const formattedItems = selectedListItems.map(item => [
        item._id,
        !!item.checked // ensure it's boolean
      ]);

      const response = await fetch(`http://10.0.0.104:3000/lists/${selectedList._id}?userId=${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items: formattedItems
        })
      });

      const result = await response.json();

      if (response.ok) {
        console.log('List updated:', result);
        setModalVisible(false);

        getUserInfo();

      } else {
        throw new Error(result.error || 'Update failed');
      }
    } catch (err) {
      console.error('Failed to update list:', err);
      Alert.alert('Error', 'Failed to save list');
    }
  };


  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://10.0.0.104:3000/lists/${id}`, {
        method: 'DELETE',
      });


      const result = await response.json();

      if (response.ok) {
        console.log('List updated:', result);
        setModalVisible(false);

        const fetchData = async () => {
          try {
            const [listsres, itemsRes] = await Promise.all([
              fetch(API_URL),
              fetch('http://10.0.0.104:3000/items') // Replace with your real endpoint
            ]);

            const lists = await listsres.json();
            const items = await itemsRes.json();

            if (!Array.isArray(lists) || !Array.isArray(items)) {
              console.error('Unexpected format:', { outfits, items });
              throw new Error('Invalid data format from server');
            }
            setAllItems(items);
            setResults(lists);


            setLoading(false);
          } catch (err) {
            console.error('Failed to fetch outfits/items 1:', err);
            setLoading(false);
          }
        };

        fetchData();

      } else {
        throw new Error(result.error || 'Update failed');
      }
    } catch (err) {
      console.error('Failed to delete list:', err);
      Alert.alert('Error', 'Failed to delete list');
    }
  };

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

  // console.log(categories)
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
              <Text style={baseStyles.emptyStateSubtext}>Try adjusting your search</Text>
            </View>
          ) : (
            <View style={styles.gridContainer}>
              {filteredResults.map((item) => (
                <View key={item._id} style={styles.gridItem}>
                  <TouchableOpacity style={styles.resultItem} onPress={() => openModal(item)}>
                    <Text style={styles.resultName}>{item?.name}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              {selectedList && (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>{selectedList.name}</Text>
                    <TouchableOpacity
                      onPress={() => {
                        // Navigate to edit page with selected item data
                        router.push({
                          pathname: '/(tabs)/add_list',
                          params: { name: selectedList.name, items: JSON.stringify(selectedList.items), id: selectedList._id },
                        });
                        closeModal();
                      }}
                      style={styles.editButton}
                    >
                      <MaterialIcons name="edit" size={24} color={COLORS.border} />
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={{ maxHeight: 400 }}>
                    {selectedListItems.map((item) => (
                      <TouchableOpacity
                        key={item._id}
                        style={styles.itemRow}
                        onPress={() => {
                          const updated = selectedListItems.map(i =>
                            i._id === item._id ? { ...i, checked: !i.checked } : i
                          );
                          setSelectedListItems(updated);
                        }}
                      >
                        <View style={styles.checkbox}>
                          {item.checked && <View style={styles.checked} />}
                        </View>
                        <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
                        <Text style={styles.itemName}>{item.name}</Text>
                      </TouchableOpacity>
                    ))}

                  </ScrollView>

                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={styles.confirmButton}
                      onPress={() => handleSave()}
                    >
                      <Text style={styles.confirmText}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDelete(selectedList._id)}
                    >
                      <Text style={styles.deleteText}>Delete</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>



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
    minHeight: screenHeight * 0.5,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
  },
  gridItem: {
    width: '100%',
    height: 100,
    // marginBottom: SPACING.lg,
  },
  resultItem: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.sm,
    shadowColor: COLORS.shadow,
    marginHorizontal: SPACING.lg,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultName: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '500',
    color: COLORS.black,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    textAlign: 'left',
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


  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '85%',
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checked: {
    width: 12,
    height: 12,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  itemImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#eee',
  },
  itemName: {
    flex: 1,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
    width: '50%',
    marginRight: 10,
  },
  confirmText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
    width: '50%',
    marginLeft: 10,
  },
  deleteText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  cancelText: {
    marginTop: 15,
    color: '#888',
    textAlign: 'center',
  },
});