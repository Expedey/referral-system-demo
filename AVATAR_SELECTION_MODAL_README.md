# AvatarSelectionModal Component

A React component that provides a 3-step modal for avatar selection with gender and age group filtering.

## Features

- **3-Step Process**: Gender selection → Age group selection → Avatar selection
- **Purple Theme**: Matches the existing dashboard theme using `#702DFF`
- **Responsive Design**: Works on desktop and mobile devices
- **Smooth Animations**: Fade-in/out transitions and hover effects
- **Progress Indicator**: Visual progress bar showing current step
- **Skip Functionality**: Users can skip steps and proceed to the next
- **Validation**: Next button is disabled until a selection is made

## Usage

```tsx
import AvatarSelectionModal from './components/AvatarSelectionModal';

function MyComponent() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);

  const handleSaveAvatar = (avatar: string) => {
    setSelectedAvatar(avatar);
    // Handle the selected avatar
  };

  return (
    <div>
      <button onClick={() => setIsModalVisible(true)}>
        Open Avatar Selection
      </button>

      <AvatarSelectionModal
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSave={handleSaveAvatar}
      />
    </div>
  );
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isVisible` | `boolean` | Yes | Controls modal visibility |
| `onClose` | `() => void` | Yes | Callback when modal is closed |
| `onSave` | `(avatar: string) => void` | Yes | Callback when avatar is saved |

## Step Details

### Step 1: Gender Selection
- Two selectable cards: Male and Female
- Each card has an emoji icon and label
- Selected card shows purple border and checkmark

### Step 2: Age Group Selection
- Two selectable cards: Young (18-35) and Old (36+)
- Each card has an emoji icon, label, and age range
- Selected card shows purple border and checkmark

### Step 3: Avatar Selection
- 12-avatar grid based on selected gender and age group
- Scrollable grid with custom scrollbar styling
- Each avatar shows a placeholder icon and number
- Selected avatar shows purple border and checkmark

## Button Behavior

- **Cancel**: Closes modal and resets all selections
- **Skip**: Available on steps 1 and 2, proceeds to next step
- **Next**: Available on steps 1 and 2, requires selection to be enabled
- **Save**: Available on step 3, requires avatar selection to be enabled

## Styling

The component uses the existing purple theme from the dashboard:
- Primary color: `#702DFF`
- Hover states: `#6f2dffbe`
- Background: Purple gradient overlays
- Custom scrollbar with purple styling

## Avatar Data Structure

The component expects avatar images to be organized as follows:
```
/avatars/
├── male-young-1.png
├── male-young-2.png
├── ...
├── male-old-1.png
├── male-old-2.png
├── ...
├── female-young-1.png
├── female-young-2.png
├── ...
├── female-old-1.png
├── female-old-2.png
└── ...
```

## Demo

See `AvatarSelectionDemo.tsx` for a complete usage example.

## Dependencies

- React
- Tailwind CSS
- Custom Button component (from the existing codebase)
- Custom scrollbar styles (defined in globals.css) 