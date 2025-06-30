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

import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';


const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

import { COLORS, SPACING, FONT_SIZES } from '../../constants/themes';

const this_page = 'lists';

const tabs = [
  { id: 'search', name: 'Search', route: '/(tabs)/home' },
  { id: 'outfits', name: 'Outfits', route: '/(tabs)/outfit' },
  { id: 'lists', name: 'Lists', route: '/(tabs)/lists' },
];

const App = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
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

  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);

  // Calculate the offset where search bar should stick
  // This is the height of header + tabs + search label and spacing
  const HEADER_HEIGHT = screenHeight * 0.2 + SPACING.lg + SPACING.md;
  const TABS_HEIGHT = 44 + SPACING.md * 2; // tab height + padding
  const SEARCH_LABEL_HEIGHT = FONT_SIZES.md + SPACING.xs + SPACING.md; // label + margin + top padding
  const STICKY_OFFSET = HEADER_HEIGHT + TABS_HEIGHT + SEARCH_LABEL_HEIGHT;

  const API_URL = 'http://10.0.0.104:3000/lists';

  useFocusEffect(
    useCallback(() => {
      setLoading(true);

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


  const handleDelete = async (id) => {
    try {
      const response = await fetch(`http://10.0.0.104:3000/items/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        // Alert.alert('Deleted', data.message);
        fetch(API_URL)
          .then(res => res.json())
          .then(data => {
            // console.log('Fetched from backend:', data);
            setResults(data);
            setLoading(false);

            // Create categories from data
            const categoryMap = {};

            data.forEach(item => {
              const cat = item.category?.toLowerCase();
              if (cat && !categoryMap[cat]) {
                categoryMap[cat] = item.imageUrl;
              }
            });

            const dynamicCategories = [
              { id: 'all', name: 'All', url: 'https://i.imgur.com/TVNYMQB.png' }, // or use null/default
              ...Object.entries(categoryMap).map(([id, url]) => ({
                id,
                name: id.charAt(0).toUpperCase() + id.slice(1),
                url,
              }))
            ];

            setCategories(dynamicCategories);
          })
          .catch(err => {
            console.error('Failed to fetch items:', err);
            setLoading(false);
          });
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
      style={[styles.tab, activeTab === tab.id && styles.tabActive]}
      onPress={() => handleTabPress(tab)}
    >
      <Text style={[
        styles.tabText,
        activeTab === tab.id && styles.tabTextActive
      ]}>
        {tab.name}
      </Text>
    </TouchableOpacity>
  );

  const handleSaveList = async () => {
    try {
      const formattedItems = selectedListItems.map(item => [
        item._id,
        !!item.checked // ensure it's boolean
      ]);

      const response = await fetch(`http://10.0.0.104:3000/lists/${selectedList._id}`, {
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
      console.error('Failed to update list:', err);
      Alert.alert('Error', 'Failed to save list');
    }
  };


  const handleDeleteList = async (id) => {
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

  // console.log(categories)
  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[
          styles.stickySearchContainer,
          { opacity: stickySearchOpacity }
        ]}
        pointerEvents={scrollY._value >= STICKY_OFFSET ? 'auto' : 'none'}
      >
        <TextInput
          style={styles.stickySearchBar}
          placeholder="Type to search"
          placeholderTextColor={COLORS.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </Animated.View>

      {/* Main Scrollable Content */}
      <Animated.ScrollView
        ref={scrollViewRef}
        style={styles.scrollContainer}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.topBackground}>
          <View style={styles.topBanner} />

          <View style={styles.header}>
            <Image source={iconImg} style={styles.avatar} />
            <Text style={styles.greeting}>Hi Sanjana!</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          {tabs.map(renderTabItem)}
        </View>

        {/* Search Section */}
        <View style={styles.searchSection}>
          <TextInput
            style={styles.searchBar}
            placeholder="Type to search"
            placeholderTextColor={COLORS.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Search Results */}
        <View style={styles.results}>
          {loading ? (
            <View style={styles.emptyStateContainer}>
              <MaterialIcons name="hourglass-empty" size={48} style={styles.emptyStateIcon} />
              <Text style={styles.emptyState}>Loading items...</Text>
            </View>
          ) : filteredResults.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateIcon}>🔍</Text>
              <Text style={styles.emptyState}>
                {searchQuery ? `No items found for "${searchQuery}"` : 'No items found.'}
              </Text>
              <Text style={styles.emptyStateSubtext}>Try adjusting your search or category filter</Text>
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
                  <Text style={styles.modalTitle}>{selectedList.name}</Text>

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
                      onPress={() => handleSaveList()}
                    >
                      <Text style={styles.confirmText}>Save</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteList(selectedList._id)}
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
        <View style={styles.bottomSpacing} />
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

export default App;

const styles = StyleSheet.create({
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
  topBanner: {
    backgroundColor: COLORS.secondary,
    height: screenHeight * 0.2,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    marginTop: -SPACING.xxxl - SPACING.xl,
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
  },
  greeting: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.black,
    marginTop: 60,
    marginLeft: SPACING.sm,
  },
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
  categoryContainer: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xxl,
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
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xxl,
  },
  categoryText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    marginTop: SPACING.xs,
  },
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
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: screenHeight * 0.1,
  },
  emptyStateIcon: {
    fontSize: FONT_SIZES.xxxl * 2,
    marginBottom: SPACING.lg,
    color: COLORS.lightGray,
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
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
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
    color: 'white',
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
    color: 'white',
    fontWeight: 'bold',
  },
  cancelText: {
    marginTop: 15,
    color: '#888',
    textAlign: 'center',
  },
});