import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, FlatList, Modal } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const App = () => {
  const [hexColor, setHexColor] = useState('#');
  const [rgbColor, setRgbColor] = useState('');
  const [hslColor, setHslColor] = useState('');
  const [rValue, setRValue] = useState('');
  const [gValue, setGValue] = useState('');
  const [bValue, setBValue] = useState('');
  const [history, setHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [error, setError] = useState('');
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    saveData()
  }, [history, favorites])

  const loadData = async () => {
    try {
      const savedHistory = await AsyncStorage.getItem('colorHistory');
      const savedFavorites = await AsyncStorage.getItem('favorites');

      if (savedHistory) setHistory(JSON.parse(savedHistory));
      if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
    } catch (error) {
      console.log('Erro ao carregar dados:', error);
    }
  };

  const saveData = async () => {
    try {
      await AsyncStorage.setItem('colorHistory', JSON.stringify(history));
      await AsyncStorage.setItem('favorites', JSON.stringify(favorites));
    } catch (error) {
      console.log('Erro ao salvar dados:', error);
    }
  };

  const hexToRgb = (hex) => {
    if (!/^#[0-9A-F]{6}$/i.test(hex)) {
      return 'Invalid Hex';
    }
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
      : null;
  };

  const rgbToHex = (r, g, b) => {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
  };

  const hexToHsl = (hex) => {
    let r = parseInt(hex.slice(1, 3), 16) / 255;
    let g = parseInt(hex.slice(3, 5), 16) / 255;
    let b = parseInt(hex.slice(5, 7), 16) / 255;

    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      let d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
  };

  const rgbToHsl = (r, g, b) => {
    r /= 255;
    g /= 255;
    b /= 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      let d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
  };

  const handleHexChange = (value) => {
    if (value.startsWith('#')) {
      setHexColor(value);
    } else {
      setHexColor('#' + value);
    }
  };

  const handleRgbChange = (r, g, b) => {
    const validateValue = (value) => {
      if (value === '' || isNaN(value)) return '';
      const numericValue = parseInt(value, 10);
      return Math.min(Math.max(numericValue, 0), 255).toString();
    };
    setRValue(validateValue(r));
    setGValue(validateValue(g));
    setBValue(validateValue(b));
    if (r !== '' && g !== '' && b !== '') {
      const hex = rgbToHex(
        parseInt(validateValue(r), 10),
        parseInt(validateValue(g), 10),
        parseInt(validateValue(b), 10)
      );
      setHexColor(hex);
    }
  };

  const handleHexSubmit = () => {
    const rgb = hexToRgb(hexColor);
    const hsl = hexToHsl(hexColor);

    if (rgb === 'Invalid Hex') {
      setError('Please enter a valid hex color (e.g. #FFFFFF)');
      setRgbColor('');
      setHslColor('');
    } else {
      setError('');
      setRgbColor(rgb);
      setHslColor(hsl);
      const newHistory = [...(history || []), { hex: hexColor, id: Math.random(), rgb, hsl, isFavorite: false }];
      setHistory(newHistory);
    }
  };

  const handleRgbSubmit = () => {
    const r = parseInt(rValue);
    const g = parseInt(gValue);
    const b = parseInt(bValue);
    const hex = rgbToHex(r, g, b);
    const hsl = rgbToHsl(r, g, b);
    setHexColor(hex);
    setRgbColor(`${r}, ${g}, ${b}`);
    setHslColor(hsl);
    const newHistory = [...(history || []), { hex, id: Math.random(), rgb: `${r}, ${g}, ${b}`, hsl, isFavorite: false }];
    setHistory(newHistory);
  };

  const toggleFavorite = (color) => {
    const updatedHistory = history.map(item =>
      item.id === color.id ? { ...item, isFavorite: !item.isFavorite } : item
    );

    setHistory(updatedHistory);
    if (!color.isFavorite) {
      setFavorites([...favorites, color]);
    } else {
      setFavorites(favorites.filter(fav => fav.id !== color.id));
    }
  };

  const deleteFromHistory = (id) => {
    const newHistory = history.filter(item => item.id !== id);
    const newFav = favorites.filter(item => item.id !== id);
    setHistory(newHistory);
    setFavorites(newFav);
  };

  const deleteFromFavorites = (id) => {
    const newFavorites = favorites.filter(item => item.id !== id);
    setFavorites(newFavorites);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Color Calculator</Text>

      <TouchableOpacity style={styles.menuButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.menuButtonText}>Favorites</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Favorite Colors</Text>
          {favorites.length > 0 ? (
            <FlatList
              data={favorites}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <View style={styles.favoriteItem}>
                  <View style={[styles.colorPreview, { backgroundColor: item.hex }]} />
                  <Text style={styles.historyText}>{item.hex} → {item.rgb} → {item.hsl}</Text>
                  <TouchableOpacity onPress={() => deleteFromFavorites(item.hex)}>
                    <AntDesign name="delete" size={24} color="black" />
                  </TouchableOpacity>
                </View>
              )}
            />
          ) : (
            <Text>No favorite colors</Text>
          )}
          <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
            <Text style={styles.buttonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <View style={styles.rgbInputContainer}>
        <TextInput
          style={styles.rgbInput}
          placeholder="R"
          keyboardType="numeric"
          value={rValue}
          onChangeText={text => handleRgbChange(text, gValue, bValue)}
          maxLength={3}
        />
        <TextInput
          style={styles.rgbInput}
          placeholder="G"
          keyboardType="numeric"
          value={gValue}
          onChangeText={text => handleRgbChange(rValue, text, bValue)}
          maxLength={3}
        />
        <TextInput
          style={styles.rgbInput}
          placeholder="B"
          keyboardType="numeric"
          value={bValue}
          onChangeText={text => handleRgbChange(rValue, gValue, text)}
          maxLength={3}
        />
      </View>

      <TouchableOpacity style={styles.button} onPress={handleRgbSubmit}>
        <Text style={styles.buttonText}>Convert RGB to HEX & HSL</Text>
      </TouchableOpacity>

      <TextInput
        style={styles.hexInput}
        placeholder="#FFFFFF"
        value={hexColor}
        onChangeText={handleHexChange}
        maxLength={7}
      />
      <TouchableOpacity style={styles.button} onPress={handleHexSubmit}>
        <Text style={styles.buttonText}>Convert HEX to RGB & HSL</Text>
      </TouchableOpacity>

      {error && <Text style={styles.errorText}>{error}</Text>}
      {rgbColor && <Text style={styles.result}>RGB: {rgbColor}</Text>}
      {hslColor && <Text style={styles.result}>HSL: {hslColor}</Text>}
      {hexColor && (
        <View style={[styles.colorDisplay, { backgroundColor: hexColor }]} />
      )}

      <ScrollView style={styles.historyContainer}>
        <Text style={styles.historyTitle}>History</Text>
        {history.map((item, index) => (
          <View key={index} style={styles.historyItem}>
            <View style={[styles.colorPreview, { backgroundColor: item.hex }]} />
            <Text style={styles.historyText}>{item.hex} → {item.rgb} → {item.hsl}</Text>
            <TouchableOpacity onPress={() => toggleFavorite(item)}>
              <AntDesign name={item.isFavorite ? "heart" : "hearto"} size={24} color={item.isFavorite ? "red" : "black"} />
            </TouchableOpacity>
            <TouchableOpacity onPress={ () => deleteFromHistory(item.id)}>
              <AntDesign name="delete" size={24} color="black" />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
    width: '100%',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
  },
  result: {
    fontSize: 16,
    marginTop: 10,
  },
  colorDisplay: {
    width: '100%',
    height: 100,
    borderWidth: 1,
    borderColor: 'gray',
    marginTop: 10,
  },
  historyContainer: {
    marginTop: 20,
    width: '100%',
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  colorPreview: {
    width: 30,
    height: 30,
    borderRadius: 5,
    marginRight: 10,
  },
  historyText: {
    flex: 1,
  },
  modalView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
  },
  errorText: {
    color: 'red',
  },
  favoriteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  menuButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  menuButtonText: {
    color: 'white',
  },
  rgbInputContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
  },
  rgbInput: {
    width: '100%',
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  hexInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    paddingHorizontal: 10,
    width: '100%',
    marginBottom: 20,
  },
});

export default App;