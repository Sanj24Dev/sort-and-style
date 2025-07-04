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

const this_page = 'search';

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

  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);

  // Calculate the offset where search bar should stick
  // This is the height of header + tabs + search label and spacing
  const HEADER_HEIGHT = screenHeight * 0.2 + SPACING.lg + SPACING.md;
  const TABS_HEIGHT = 44 + SPACING.md * 2; // tab height + padding
  const SEARCH_LABEL_HEIGHT = FONT_SIZES.md + SPACING.xs + SPACING.md; // label + margin + top padding
  const STICKY_OFFSET = HEADER_HEIGHT + TABS_HEIGHT + SEARCH_LABEL_HEIGHT;

  const API_URL = 'http://10.0.0.104:3000/items';

  useFocusEffect(
    useCallback(() => {
      setLoading(true);

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
    console.log('Opening modal for:', item.name);
    setSelectedItem(item);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedItem(null);
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

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContainer}
        >
          {categories.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.categoryItem,
                selectedCategory === item.id && styles.categoryItemActive
              ]}
              onPress={() => setSelectedCategory(item.id)}
            >
              <View style={[
                styles.categoryCircle,
                selectedCategory === item.id && styles.categoryCircleActive
              ]}>
                <Image
                  source={{ uri: item.url }}
                  style={styles.categoryImage}
                />
              </View>
              <Text style={[
                styles.categoryText
              ]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Search Results */}
        <View style={styles.results}>
          {loading ? (
            <View style={styles.emptyStateContainer}>
              <MaterialIcons name="hourglass-empty" size={48} style={styles.emptyStateIcon} />
              <Text style={styles.emptyState}>Loading items...</Text>
            </View>
          ) : filteredResults.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <MaterialIcons name="search" size={48} style={styles.emptyStateIcon} />
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
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              {selectedItem && (
                <>
                  <Image
                    source={{ uri: selectedItem.imageUrl }}
                    style={styles.modalImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.modalTitle}>{selectedItem.name}</Text>
                  <View style={styles.modalActions}>

                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => {
                        // Navigate to edit page with selected item data
                        router.push({
                          pathname: '/(tabs)/add_item',
                          params: { name : selectedItem.name, category: selectedItem.category, imageUrl: selectedItem.imageUrl, id: selectedItem._id }
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
  modalActions: {
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
    marginRight : 10,
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
    marginLeft : 10,
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