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
} from 'react-native';
import { useRouter } from 'expo-router';
import iconImg from '@/assets/images/icon.png';
import { MaterialIcons } from '@expo/vector-icons';

import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

import { COLORS, SPACING, FONT_SIZES } from '../../constants/themes';

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


  const router = useRouter();

  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);

  // Calculate the offset where search bar should stick
  // This is the height of header + tabs + search label and spacing
  const HEADER_HEIGHT = screenHeight * 0.2 + SPACING.lg + SPACING.md;
  const TABS_HEIGHT = 44 + SPACING.md * 2; // tab height + padding
  const SEARCH_LABEL_HEIGHT = FONT_SIZES.md + SPACING.xs + SPACING.md; // label + margin + top padding
  const STICKY_OFFSET = HEADER_HEIGHT + TABS_HEIGHT + SEARCH_LABEL_HEIGHT;

  const ITEMS_API_URL = 'http://10.0.0.104:3000/items';
  const API_URL = 'http://10.0.0.104:3000/outfits';

  useFocusEffect(
    useCallback(() => {
      setLoading(true);

      const fetchData = async () => {
        try {
          const [outfitsRes, itemsRes] = await Promise.all([
            fetch(API_URL),
            fetch(ITEMS_API_URL) // Replace with your real endpoint
          ]);

          const outfits = await outfitsRes.json();
          const items = await itemsRes.json();

          if (!Array.isArray(outfits) || !Array.isArray(items)) {
            console.error('Unexpected format:', { outfits, items });
            throw new Error('Invalid data format from server');
          }

          const itemMap = {};
          items.forEach(it => {
            itemMap[it._id] = it; // index items by ID for fast lookup
          });

          // Attach full item objects into outfits
          const enrichedOutfits = outfits.map(outfit => ({
            ...outfit,
            items: outfit.items.map(itemId => itemMap[itemId]).filter(Boolean)
          }));

          setResults(enrichedOutfits);
          setLoading(false);

          // Build categories
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
        try {
          const [outfitsRes, itemsRes] = await Promise.all([
            fetch(API_URL),
            fetch(ITEMS_API_URL)
          ]);

          const outfits = await outfitsRes.json();
          const items = await itemsRes.json();

          const itemMap = {};
          items.forEach(it => {
            itemMap[it._id] = it; // index items by ID for fast lookup
          });

          // Attach full item objects into outfits
          const enrichedOutfits = outfits.map(outfit => ({
            ...outfit,
            items: outfit.items.map(itemId => itemMap[itemId]).filter(Boolean)
          }));

          setResults(enrichedOutfits);
          setLoading(false);

          // Build categories
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

        } catch (err) {
          console.error('Failed to fetch outfits/items 2:', err);
          setLoading(false);
        }
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

  return (
    <SafeAreaView style={styles.container}>
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
                  style={styles.categoryImageScroll}
                />
              </View>
              <Text style={[
                styles.categoryTextScroll
              ]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Results */}
        <View style={styles.results}>
          {loading ? (
            <View style={styles.emptyStateContainer}>
              <MaterialIcons name="hourglass-empty" size={48} style={styles.emptyStateIcon} />
              <Text style={styles.emptyState}>Loading items...</Text>
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
                              params: { category: item.category, items: item.items.map(it => it._id), id: item._id},
                            });
                          }}
                          style={styles.editButton}
                        >
                          <MaterialIcons name="edit" size={24} color={COLORS.border} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() =>
                            Alert.alert('Delete outfit?', 'This action cannot be undone.', [
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
  categoryImageScroll: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xxxl,
  },
  categoryTextScroll: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    marginTop: SPACING.md,
  },
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
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: screenHeight * 0.1,
  },
  emptyStateIcon: {
    fontSize: FONT_SIZES.xxxl * 2,
    marginBottom: SPACING.lg,
  },
  emptyState: {
    textAlign: 'center',
    color: COLORS.primary,
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    marginBottom: SPACING.xs,
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