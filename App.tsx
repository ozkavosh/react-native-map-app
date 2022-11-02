import React, {useState, useEffect, useReducer, useRef} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Animated,
  Image,
  TouchableOpacity
} from 'react-native';
import MapView, {
  MapType,
  Polyline,
  Marker,
  enableLatestRenderer,
  PROVIDER_GOOGLE,
} from 'react-native-maps';
import Geolocation from '@react-native-community/geolocation';
// @ts-ignore
import {GOOGLE_API_KEY} from 'react-native-dotenv';
import MapViewDirections from 'react-native-maps-directions';
import lineas from './lineas';

enableLatestRenderer();

const App = () => {
  const [position, setPosition] = useState({
    latitude: -26.834129,
    longitude: -65.194769,
    latitudeDelta: 0.001,
    longitudeDelta: 0.001,
  });
  const [mapType, setMapType] = useState("standard");
  const [markerState, markerDispatch] = useReducer(
    (state: any, action: any): any => {
      switch (action.type) {
        case 'CREATE_MARKER':
          return {
            markerPosition: {...state.markerPosition, ...action.payload},
            markerShown: true,
            markerTitle: `Lat: ${action.payload.latitude}, Lng: ${action.payload.longitude}`,
            markerPresses: 0,
          };
        case 'HIDE_MARKER':
          return {...state, markerShown: false};
        case 'PRESS_MARKER':
          return {...state, markerPresses: state.markerPresses + 1};
        default:
          return state;
      }
    },
    {
      markerPosition: {
        latitude: 0,
        longitude: 0,
        latitudeDelta: 0.0421,
        longitudeDelta: 0.0421,
      },
      markerShown: false,
      markerTitle: '',
      markerPresses: 0,
    },
  );
  const animatedBottom = useRef(new Animated.Value(0)).current;
  const circleRef = useRef(null);
  const waypointRef = useRef(0);
  const intervalRef = useRef(null);
  const [showLine, setShowLine] = useState(false);
  const [currentLine, setCurrentLine] = useState({waypoints: [], length: 0});
  const [isMenuShowing, setIsMenuShowing] = useState(false);

  const showLineMenu = () => {
    Animated.timing(animatedBottom, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const hideLineMenu = () => {
    Animated.timing(animatedBottom, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    Geolocation.getCurrentPosition(pos => {
      const crd = pos.coords;
      setPosition({
        latitude: crd.latitude,
        longitude: crd.longitude,
        latitudeDelta: 0.0421,
        longitudeDelta: 0.0421,
      });
    });
  }, []);

  useEffect(() => {
    if ((currentLine as any).length) {
      setShowLine(true);
      intervalRef.current = setInterval(() => {
        if (waypointRef.current !== (currentLine as any).length) {
          circleRef.current.animateMarkerToCoordinate(
            (currentLine as any).waypoints[waypointRef.current],
            1000,
          );
          waypointRef.current += 1;
        } else {
          waypointRef.current = 0;
        }
      }, 1010);
    }

    return () => intervalRef.current && clearInterval(intervalRef.current);
  }, [(currentLine as any).length, (currentLine as any).waypoints]);

  const styles = StyleSheet.create({
    heading: {
      fontSize: 24,
      fontWeight: 'bold',
      textTransform: 'uppercase',
      marginBottom: 15,
    },
    container: {
      flex: 1,
      width: '100%',
      justifyContent: 'flex-end',
      alignItems: 'center',
    },
    map: {
      width: '100%',
      height: '100%',
    },
  });

  const createMarker = (cords: any) => {
    markerDispatch({type: 'CREATE_MARKER', payload: cords});
  };

  const handleMarkerPress = () => {
    if (markerState.markerPresses === 1) {
      return markerDispatch({type: 'HIDE_MARKER'});
    }
    return markerDispatch({type: 'PRESS_MARKER'});
  };

  const handleLinePress = line => {
    setPosition({
      latitudeDelta: 0.0421,
      longitudeDelta: 0.0421,
      ...line.waypoints[0],
    });
    setShowLine(false);
    intervalRef.current && clearInterval(intervalRef.current);
    waypointRef.current = 0;
    setCurrentLine({
      length: line.waypoints.length - 1,
      waypoints: line.waypoints,
    });
  };

  const handleMenuButtonPress = () => {
    if (isMenuShowing) {
      hideLineMenu();
      setIsMenuShowing(false);
    } else {
      showLineMenu();
      setIsMenuShowing(true);
    }
  };

  const handleMapType = () => {
    if(mapType === 'standard'){
      setMapType('satellite');
    }else{
      setMapType('standard');
    }
  }

  return (
    <SafeAreaView style={{flex: 1, alignItems: 'center'}}>
      <View
        style={{
          width: '100%',
          height: 50,
          backgroundColor: 'skyblue',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text
          style={{
            color: 'white',
            fontSize: 25,
            textTransform: 'uppercase',
            fontWeight: 'bold',
          }}>
          TucuMap
        </Text>
      </View>
      <View style={styles.container}>
        <MapView
          mapType={(mapType as MapType)}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          showsUserLocation={true}
          region={position}
          onLongPress={({nativeEvent: {coordinate}}) =>
            createMarker(coordinate)
          }>
          {markerState.markerShown && (
            <Marker
              onPress={handleMarkerPress}
              coordinate={markerState.markerPosition}
              title={markerState.markerTitle}
            />
          )}
          {markerState.markerShown && (
            <MapViewDirections
              origin={position}
              destination={markerState.markerPosition}
              strokeColor="skyblue"
              strokeWidth={6}
              apikey={GOOGLE_API_KEY}
            />
          )}
          {showLine && (
            <>
              <Polyline
                coordinates={currentLine.waypoints}
                strokeColor="skyblue"
                strokeWidth={6}
              />
              <Marker.Animated
                icon={require('./src/img/bus_icon.png')}
                ref={circleRef}
                coordinate={currentLine.waypoints[0]}
              />
            </>
          )}
        </MapView>
      </View>

      <TouchableOpacity 
      onPress={handleMapType}
      style={{
            width: 37,
            height: 37,
            position: 'absolute',
            backgroundColor: 'white',
            right: 12,
            top: 115,
            padding: 5,
            opacity: 0.8
          }}>
            <Image source={{uri: "https://cdn-icons-png.flaticon.com/512/162/162893.png"}} style={{ width: '100%', height: '100%' }} />
      </TouchableOpacity>

      <Animated.View
        style={{
          position: 'absolute',
          bottom: 0,
          transform: [
            {
              translateY: animatedBottom.interpolate({
                inputRange: [0, 1],
                outputRange: [250, 0],
              }),
            },
            {perspective: 1000},
          ],
          width: '100%',
          alignItems: 'center',
        }}>
        <Animated.View
          style={{
            transform: [
              {
                rotate: animatedBottom.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '180deg'],
                }),
              },
              {perspective: 1000},
            ],
          }}>
          <Pressable
            onPress={handleMenuButtonPress}
            style={{
              backgroundColor: 'skyblue',
              width: 35,
              height: 35,
              borderRadius: 50,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 15,
              marginTop: 15,
            }}>
            <Text style={{fontSize: 28, fontWeight: 'bold', color: 'white'}}>
              ^
            </Text>
          </Pressable>
        </Animated.View>
        <ScrollView style={{height: 250, width: '100%', paddingHorizontal: 10}}>
          {lineas.map((line, index) => (
            <Pressable
              key={index}
              onPress={() => handleLinePress(line)}
              style={{
                width: '100%',
                height: 55,
                backgroundColor: 'skyblue',
                paddingHorizontal: 15,
                marginBottom: 5,
                justifyContent: 'center',
              }}>
              <Text
                style={{
                  textTransform: 'uppercase',
                  color: 'white',
                  fontWeight: 'bold',
                }}>
                {line.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
};

export default App;
