import React, { useState, Suspense, lazy } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';

// Lazy load views
const HomeView = lazy(() => import('./home'));
const OutfitsView = lazy(() => import('./outfit'));
const ListsView = lazy(() => import('./home'));

export default function IndexScreen() {
  const [activeView, setActiveView] = useState('home');

  const tabs = [
    { id: 'home', name: 'Home' },
    { id: 'outfits', name: 'Outfits' },
    { id: 'lists', name: 'Lists' },
  ];

  const renderContent = () => {
    switch (activeView) {
      case 'home':
        return <HomeView />;
      case 'outfits':
        return <OutfitsView />;
      case 'lists':
        return <ListsView />;
      default:
        return null;
    }
  };

  return (
  <View style={styles.container}>
    <Suspense fallback={<ActivityIndicator size="large" color="#888" />}>
      {renderContent()}
    </Suspense>
  </View>
);

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // paddingTop: 50,
    backgroundColor: '#fff',
  },
});
