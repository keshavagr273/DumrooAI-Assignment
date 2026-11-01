import React from 'react';
import { Bug, Palette, Sparkles, MessageSquare, HelpCircle } from 'lucide-react';
import { FEEDBACK_CATEGORIES } from '../utils/constants.js';
import styles from '../styles/feedback.module.css';

const ICONS = {
  bug: Bug,
  ui_ux: Palette,
  feature_request: Sparkles,
  general: MessageSquare,
  other: HelpCircle,
};

const GRADIENTS = {
  bug: 'var(--fb-cat-bug-gradient)',
  ui: 'var(--fb-cat-ui-gradient)',
  feature: 'var(--fb-cat-feature-gradient)',
  general: 'var(--fb-cat-general-gradient)',
  other: 'var(--fb-cat-other-gradient)',
};

export function CategorySelector({ selectedCategory, onSelectCategory }) {
  return (
    <div>
      <div className={styles.sectionLabel}>
        <span>Feedback Category</span>
      </div>
      <div className={styles.categoryGrid} role="radiogroup" aria-label="Feedback Category">
        {FEEDBACK_CATEGORIES.map((cat) => {
          const IconComponent = ICONS[cat.id] || HelpCircle;
          const isSelected = selectedCategory === cat.id;
          const activeClass = isSelected ? styles[`catActive_${cat.colorKey}`] : '';

          return (
            <button
              key={cat.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              className={`${styles.categoryCard} ${isSelected ? styles.categoryCardActive : ''} ${activeClass}`}
              onClick={() => onSelectCategory(cat.id)}
            >
              <div
                className={styles.catIconWrapper}
                style={{ background: GRADIENTS[cat.colorKey] }}
              >
                <IconComponent size={18} />
              </div>
              <div className={styles.catInfo}>
                <span className={styles.catLabel}>{cat.label}</span>
                <span className={styles.catDescription}>{cat.description}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default CategorySelector;

