import { useState, useEffect } from 'react';
import { getNutrition, addNutrition, updateNutrition, deleteNutrition } from '../services/nutritionService';
import { exportToCSV, exportNutritionToPDF } from '../services/exportService';
import { nutritionToCSVRows } from '../utils/csvRows';
import DateRangeFilter from '../components/DateRangeFilter';
import { inDateRange, sortByDate } from '../utils/filters';
import { useAuth } from '../context/AuthContext';
import { FOODS, findFood, calcMacros, parseAmount } from '../data/foods';

function NutritionPage() {
  const [entries, setEntries] = useState([]);
  const [mealType, setMealType] = useState('breakfast');
  const [foodItem, setFoodItem] = useState('');
  const [quantity, setQuantity] = useState('');
  const [amount, setAmount] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');
  const [date, setDate] = useState('');
  const [editingId, setEditingId] = useState(null);
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMealType, setFilterMealType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [order, setOrder] = useState('newest');

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    const data = await getNutrition();
    setEntries(data);
  };

  const resetForm = () => {
    setMealType('breakfast');
    setFoodItem('');
    setQuantity('');
    setAmount('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFats('');
    setDate('');
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const nutritionData = {
      mealType,
      foodItem,
      quantity,
      calories,
      protein,
      carbs,
      fats,
      date: date || undefined,
    };

    if (editingId) {
      await updateNutrition(editingId, nutritionData);
    } else {
      await addNutrition(nutritionData);
    }

    resetForm();
    fetchEntries();
  };

  // Food list mein se jo khana mila, uske hisab se macros khud bhar dena
  const matchedFood = findFood(foodItem);

  const applyMacros = (food, amt) => {
    setQuantity(amt ? `${amt} ${food.unit}` : '');
    const macros = amt ? calcMacros(food, amt) : null;
    if (macros) {
      setCalories(macros.calories);
      setProtein(macros.protein);
      setCarbs(macros.carbs);
      setFats(macros.fats);
    }
  };

  const handleFoodChange = (value) => {
    setFoodItem(value);
    const food = findFood(value);
    if (food) {
      // Naya khana chuna: default amount (100 g ya 1 piece) laga do
      const defaultAmount = String(food.base);
      setAmount(defaultAmount);
      applyMacros(food, defaultAmount);
    } else {
      setAmount('');
    }
  };

  const handleAmountChange = (value) => {
    setAmount(value);
    if (matchedFood) applyMacros(matchedFood, value);
  };

  const handleEdit = (entry) => {
    setMealType(entry.mealType);
    setFoodItem(entry.foodItem);
    setQuantity(entry.quantity);
    setAmount(findFood(entry.foodItem) ? parseAmount(entry.quantity) : '');
    setCalories(entry.calories);
    setProtein(entry.protein || '');
    setCarbs(entry.carbs || '');
    setFats(entry.fats || '');
    setDate(entry.date.split('T')[0]);
    setEditingId(entry._id);
  };

  const handleDelete = async (id) => {
    await deleteNutrition(id);
    fetchEntries();
  };
  const filteredEntries = sortByDate(
    entries.filter(
      (n) =>
        n.foodItem.toLowerCase().includes(searchTerm.toLowerCase().trim()) &&
        (filterMealType ? n.mealType === filterMealType : true) &&
        inDateRange(n.date, from, to)
    ),
    order
  );
  const hasFilters = searchTerm || filterMealType || from || to || order !== 'newest';

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Nutrition Log</h2>
        <div className="export-buttons">
          <button onClick={() => exportToCSV(nutritionToCSVRows(filteredEntries), 'nutrition')} className="export-btn">
            📄 CSV
          </button>
          <button onClick={() => exportNutritionToPDF(filteredEntries, user.name)} className="export-btn">
            📑 PDF
          </button>
        </div>
      </div>

      <div className="search-filter-bar">
        <input
          type="text"
          placeholder="🔍 Search food item..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select value={filterMealType} onChange={(e) => setFilterMealType(e.target.value)} aria-label="Filter by meal type">
          <option value="">All Meal Types</option>
          <option value="breakfast">Breakfast</option>
          <option value="lunch">Lunch</option>
          <option value="dinner">Dinner</option>
          <option value="snacks">Snacks</option>
        </select>
        <DateRangeFilter from={from} to={to} onFromChange={setFrom} onToChange={setTo} />
        <select value={order} onChange={(e) => setOrder(e.target.value)} aria-label="Sort order">
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
        {hasFilters && (
          <button
            type="button"
            className="clear-filter-btn"
            onClick={() => {
              setSearchTerm('');
              setFilterMealType('');
              setFrom('');
              setTo('');
              setOrder('newest');
            }}
          >
            Clear
          </button>
        )}
      </div>
      {hasFilters && (
        <p className="filter-count">
          Showing {filteredEntries.length} of {entries.length}
        </p>
      )}

      <form onSubmit={handleSubmit} className="workout-form">
        <select value={mealType} onChange={(e) => setMealType(e.target.value)}>
          <option value="breakfast">Breakfast</option>
          <option value="lunch">Lunch</option>
          <option value="dinner">Dinner</option>
          <option value="snacks">Snacks</option>
        </select>
        <input
          type="text"
          placeholder="Food Item (type to search)"
          list="food-options"
          value={foodItem}
          onChange={(e) => handleFoodChange(e.target.value)}
          required
        />
        <datalist id="food-options">
          {FOODS.map((f) => (
            <option key={f.name} value={f.name} />
          ))}
        </datalist>
        {matchedFood ? (
          <input
            type="number"
            min="0"
            step="any"
            placeholder={`Amount (${matchedFood.unit})`}
            aria-label={`Amount in ${matchedFood.unit}`}
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            onWheel={(e) => e.target.blur()}
            required
          />
        ) : (
          <input
            type="text"
            placeholder="Quantity (e.g. 200g, 1 cup)"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        )}
        <input
          type="number"
          placeholder="Calories"
          value={calories}
          onChange={(e) => setCalories(e.target.value)}
          onWheel={(e) => e.target.blur()}
          required
        />
        <input
          type="number"
          placeholder="Protein (g)"
          value={protein}
          onChange={(e) => setProtein(e.target.value)}
          onWheel={(e) => e.target.blur()}
        />
        <input
          type="number"
          placeholder="Carbs (g)"
          value={carbs}
          onChange={(e) => setCarbs(e.target.value)}
          onWheel={(e) => e.target.blur()}
        />
        <input
          type="number"
          placeholder="Fats (g)"
          value={fats}
          onChange={(e) => setFats(e.target.value)}
          onWheel={(e) => e.target.blur()}
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <button type="submit">{editingId ? 'Update Entry' : 'Add Entry'}</button>
        <p className="food-hint form-full-width">
          {matchedFood
            ? `Calories and macros are filled automatically for ${amount || 0} ${matchedFood.unit} (approximate). You can still edit them.`
            : 'Tip: pick a food from the list to fill calories, protein, carbs and fats automatically. For other foods, enter the values yourself.'}
        </p>
      </form>

      <div className="workout-list">
       {filteredEntries.length === 0 && <p>No entries found.</p>}
       {filteredEntries.map((entry) => (
          <div key={entry._id} className="workout-card">
            <div>
              <h3>
                {entry.foodItem} <span className="meal-tag">{entry.mealType}</span>
              </h3>
              <p>
                {entry.quantity} · {entry.calories} kcal
                {entry.protein ? ` · P: ${entry.protein}g` : ''}
                {entry.carbs ? ` · C: ${entry.carbs}g` : ''}
                {entry.fats ? ` · F: ${entry.fats}g` : ''}
              </p>
              <small>{new Date(entry.date).toLocaleDateString()}</small>
            </div>
            <div className="workout-actions">
              <button onClick={() => handleEdit(entry)}>Edit</button>
              <button onClick={() => handleDelete(entry._id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default NutritionPage;