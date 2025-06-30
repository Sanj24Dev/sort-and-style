import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, Text, View } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
            height: 70,
            paddingBottom: 10,
          },
          android: {
            height: 70,
            paddingBottom: 10,
          },
        }),
        tabBarLabelStyle: {
          fontSize: 12,
        },
      }}>
      
      {/* Home Tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />

      {/* Add Tab */}
      <Tabs.Screen
        name="create"
        options={{
          title: '',
          tabBarIcon: () => (
            <View
              style={{
                backgroundColor: '#A35C7A',
                width: 56,
                height: 56,
                borderRadius: 28,
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: Platform.OS === 'ios' ? 30 : 20,
                shadowColor: '#000',
                shadowOpacity: 0.15,
                shadowOffset: { width: 0, height: 3 },
                shadowRadius: 6,
                elevation: 6,
              }}>
              <Text style={{ color: 'white', fontSize: 30, lineHeight: 30 }}>＋</Text>
            </View>
          ),
          tabBarLabel: () => null,
        }}
      />

      {/* Favorites Tab */}
      <Tabs.Screen
        name="moodboard"
        options={{
          title: 'Moodboard',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="heart.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          href: null, 
        }}
      />
      <Tabs.Screen
        name="outfit"
        options={{
          href: null, 
        }}
      />
      <Tabs.Screen
        name="lists"
        options={{
          href: null, 
        }}
      />
      <Tabs.Screen
        name="add_item"
        options={{
          href: null, 
        }}
      />
      <Tabs.Screen
        name="add_outfit"
        options={{
          href: null, 
        }}
      />
      <Tabs.Screen
        name="add_list"
        options={{
          href: null, 
        }}
      />
    </Tabs>
  );
}
