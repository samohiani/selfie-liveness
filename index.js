/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

// Error boundary to catch initialization errors
try {
  AppRegistry.registerComponent(appName, () => App);
} catch (error) {
  console.error('Failed to register app component:', error);
}