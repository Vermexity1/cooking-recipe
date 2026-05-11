export type Recipe = {
  title: string;
  category: string;
  time: string;
  serves: string;
  image: string;
  description: string;
  ingredients: string[];
};

export const recipes: Recipe[] = [
  {
    title: "Lemon Ricotta Pancakes",
    category: "Breakfast",
    time: "25 min",
    serves: "4",
    image:
      "https://images.unsplash.com/photo-1528207776546-365bb710ee93?auto=format&fit=crop&w=900&q=80",
    description: "Cloud-soft pancakes with lemon zest, ricotta, and a warm berry spooning sauce.",
    ingredients: ["Ricotta", "Lemon zest", "Blueberries", "Maple syrup"],
  },
  {
    title: "Garden Herb Frittata",
    category: "Brunch",
    time: "30 min",
    serves: "6",
    image:
      "https://images.unsplash.com/photo-1608039829572-78524f79c4c7?auto=format&fit=crop&w=900&q=80",
    description: "A skillet frittata packed with herbs, spring onions, feta, and soft greens.",
    ingredients: ["Eggs", "Feta", "Spinach", "Chives"],
  },
  {
    title: "Peach Burrata Toast",
    category: "Small Plates",
    time: "15 min",
    serves: "2",
    image:
      "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&w=900&q=80",
    description: "Toasted sourdough with ripe peaches, torn burrata, basil, and honey.",
    ingredients: ["Sourdough", "Burrata", "Peaches", "Basil"],
  },
  {
    title: "Crisp Citrus Salad",
    category: "Salads",
    time: "18 min",
    serves: "4",
    image:
      "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=80",
    description: "A bright bowl of shaved fennel, oranges, avocado, pistachio, and mint.",
    ingredients: ["Fennel", "Orange", "Avocado", "Pistachios"],
  },
  {
    title: "Tomato Basil Pasta",
    category: "Dinner",
    time: "35 min",
    serves: "4",
    image:
      "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=900&q=80",
    description: "Glossy pasta folded with slow-simmered tomatoes, basil, garlic, and parmesan.",
    ingredients: ["Pasta", "Tomatoes", "Basil", "Parmesan"],
  },
  {
    title: "Golden Coconut Curry",
    category: "Dinner",
    time: "40 min",
    serves: "4",
    image:
      "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=900&q=80",
    description: "A silky turmeric coconut curry with vegetables, chickpeas, and jasmine rice.",
    ingredients: ["Coconut milk", "Chickpeas", "Turmeric", "Jasmine rice"],
  },
  {
    title: "Charred Corn Tacos",
    category: "Weeknight",
    time: "28 min",
    serves: "4",
    image:
      "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=900&q=80",
    description: "Warm tortillas with charred corn, lime crema, cabbage, and cilantro.",
    ingredients: ["Corn", "Tortillas", "Lime", "Cabbage"],
  },
  {
    title: "Margherita Flatbread",
    category: "Oven",
    time: "22 min",
    serves: "3",
    image:
      "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=80",
    description: "Crisp flatbread with crushed tomato, mozzarella, basil, and olive oil.",
    ingredients: ["Flatbread", "Mozzarella", "Tomato", "Basil"],
  },
  {
    title: "Miso Mushroom Ramen",
    category: "Noodles",
    time: "45 min",
    serves: "2",
    image:
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=900&q=80",
    description: "Deep miso broth with ramen noodles, mushrooms, jammy eggs, and scallions.",
    ingredients: ["Miso", "Ramen", "Mushrooms", "Eggs"],
  },
  {
    title: "Seared Salmon Bowl",
    category: "Dinner",
    time: "32 min",
    serves: "2",
    image:
      "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=900&q=80",
    description: "Crisp salmon over rice with cucumber, edamame, sesame, and ginger sauce.",
    ingredients: ["Salmon", "Rice", "Cucumber", "Edamame"],
  },
  {
    title: "Roasted Squash Soup",
    category: "Soups",
    time: "50 min",
    serves: "6",
    image:
      "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=900&q=80",
    description: "Velvety roasted squash soup with ginger, cream, pepitas, and thyme.",
    ingredients: ["Squash", "Ginger", "Cream", "Pepitas"],
  },
  {
    title: "Wild Rice Pilaf",
    category: "Sides",
    time: "55 min",
    serves: "6",
    image:
      "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=80",
    description: "Nutty wild rice tossed with herbs, cranberries, almonds, and orange zest.",
    ingredients: ["Wild rice", "Cranberries", "Almonds", "Parsley"],
  },
  {
    title: "Rosemary Roast Chicken",
    category: "Sunday",
    time: "1 hr 20",
    serves: "5",
    image:
      "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=900&q=80",
    description: "Juicy roast chicken with lemon, rosemary, garlic, and pan potatoes.",
    ingredients: ["Chicken", "Rosemary", "Lemon", "Potatoes"],
  },
  {
    title: "Sesame Soba Noodles",
    category: "Lunch",
    time: "20 min",
    serves: "3",
    image:
      "https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=900&q=80",
    description: "Cool soba noodles with sesame dressing, cucumber ribbons, and herbs.",
    ingredients: ["Soba", "Sesame", "Cucumber", "Mint"],
  },
  {
    title: "Berry Mascarpone Tart",
    category: "Dessert",
    time: "45 min",
    serves: "8",
    image:
      "https://images.unsplash.com/photo-1464305795204-6f5bbfc7fb81?auto=format&fit=crop&w=900&q=80",
    description: "Buttery tart shell with mascarpone cream, berries, and lemon sugar.",
    ingredients: ["Mascarpone", "Berries", "Pastry", "Lemon"],
  },
  {
    title: "Chocolate Olive Oil Cake",
    category: "Dessert",
    time: "1 hr",
    serves: "10",
    image:
      "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=80",
    description: "A tender dark chocolate cake with olive oil, sea salt, and cocoa glaze.",
    ingredients: ["Chocolate", "Olive oil", "Cocoa", "Sea salt"],
  },
  {
    title: "Vanilla Bean Granola",
    category: "Pantry",
    time: "35 min",
    serves: "10",
    image:
      "https://images.unsplash.com/photo-1517093157656-b9eccef91cb1?auto=format&fit=crop&w=900&q=80",
    description: "Toasty oat clusters with almonds, vanilla, coconut, and dried apricots.",
    ingredients: ["Oats", "Almonds", "Vanilla", "Coconut"],
  },
  {
    title: "Green Goddess Sandwich",
    category: "Lunch",
    time: "15 min",
    serves: "2",
    image:
      "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=900&q=80",
    description: "Layers of avocado, sprouts, cucumber, herbed yogurt, and seeded bread.",
    ingredients: ["Avocado", "Sprouts", "Cucumber", "Yogurt"],
  },
  {
    title: "Crispy Gnocchi Skillet",
    category: "Weeknight",
    time: "25 min",
    serves: "4",
    image:
      "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=900&q=80",
    description: "Pan-crisped gnocchi with cherry tomatoes, greens, garlic, and pecorino.",
    ingredients: ["Gnocchi", "Tomatoes", "Greens", "Pecorino"],
  },
  {
    title: "Honey Fig Crostini",
    category: "Appetizers",
    time: "12 min",
    serves: "6",
    image:
      "https://images.unsplash.com/photo-1485963631004-f2f00b1d6606?auto=format&fit=crop&w=900&q=80",
    description: "Crisp crostini with whipped goat cheese, figs, honey, and black pepper.",
    ingredients: ["Figs", "Goat cheese", "Honey", "Baguette"],
  },
  {
    title: "Herbed Lentil Stew",
    category: "Comfort",
    time: "45 min",
    serves: "6",
    image:
      "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=900&q=80",
    description: "Earthy lentils simmered with carrots, celery, rosemary, and tomato.",
    ingredients: ["Lentils", "Carrots", "Celery", "Rosemary"],
  },
  {
    title: "Strawberry Chia Pudding",
    category: "Breakfast",
    time: "10 min",
    serves: "4",
    image:
      "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=900&q=80",
    description: "Creamy chia pudding with strawberries, yogurt, toasted coconut, and honey.",
    ingredients: ["Chia", "Strawberries", "Yogurt", "Coconut"],
  },
  {
    title: "Garlic Butter Shrimp",
    category: "Fast Dinner",
    time: "18 min",
    serves: "4",
    image:
      "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=900&q=80",
    description: "Quick shrimp in garlic butter with lemon, parsley, chili, and crusty bread.",
    ingredients: ["Shrimp", "Garlic", "Butter", "Lemon"],
  },
  {
    title: "Apple Cardamom Crumble",
    category: "Dessert",
    time: "55 min",
    serves: "8",
    image:
      "https://images.unsplash.com/photo-1562007908-17c67e878c88?auto=format&fit=crop&w=900&q=80",
    description: "Warm apples under an oat crumble with cardamom, brown sugar, and cream.",
    ingredients: ["Apples", "Oats", "Cardamom", "Cream"],
  },
];
