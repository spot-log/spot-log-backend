CREATE TABLE IF NOT EXISTS notification_settings (
  id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  public_memo ENUM('OFF', 'ON') NOT NULL DEFAULT 'OFF',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_notification_settings_user_id (user_id),
  CONSTRAINT fk_notification_settings_user_id
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DELETE stale
FROM notification_settings AS stale
JOIN notification_settings AS keeper
  ON stale.user_id = keeper.user_id
 AND (
   stale.updated_at < keeper.updated_at
   OR (stale.updated_at = keeper.updated_at AND stale.id > keeper.id)
 );

ALTER TABLE notification_settings
  MODIFY COLUMN public_memo ENUM('OFF', 'ON') NOT NULL DEFAULT 'OFF';

SET @notification_settings_has_private_memo := (
  SELECT COUNT(*)
  FROM information_schema.columns
  WHERE table_schema = DATABASE()
    AND table_name = 'notification_settings'
    AND column_name = 'private_memo'
);

SET @notification_settings_drop_private_memo_sql := IF(
  @notification_settings_has_private_memo > 0,
  'ALTER TABLE notification_settings DROP COLUMN private_memo',
  'SELECT 1'
);

PREPARE notification_settings_drop_private_memo_stmt FROM @notification_settings_drop_private_memo_sql;
EXECUTE notification_settings_drop_private_memo_stmt;
DEALLOCATE PREPARE notification_settings_drop_private_memo_stmt;

SET @notification_settings_has_unique_user_id := (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'notification_settings'
    AND column_name = 'user_id'
    AND non_unique = 0
);

SET @notification_settings_add_unique_sql := IF(
  @notification_settings_has_unique_user_id = 0,
  'ALTER TABLE notification_settings ADD CONSTRAINT uniq_notification_settings_user_id UNIQUE (user_id)',
  'SELECT 1'
);

PREPARE notification_settings_add_unique_stmt FROM @notification_settings_add_unique_sql;
EXECUTE notification_settings_add_unique_stmt;
DEALLOCATE PREPARE notification_settings_add_unique_stmt;

SET @notification_settings_has_user_fk := (
  SELECT COUNT(*)
  FROM information_schema.KEY_COLUMN_USAGE
  WHERE table_schema = DATABASE()
    AND table_name = 'notification_settings'
    AND column_name = 'user_id'
    AND referenced_table_name = 'users'
    AND referenced_column_name = 'id'
);

SET @notification_settings_add_fk_sql := IF(
  @notification_settings_has_user_fk = 0,
  'ALTER TABLE notification_settings ADD CONSTRAINT fk_notification_settings_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE',
  'SELECT 1'
);

PREPARE notification_settings_add_fk_stmt FROM @notification_settings_add_fk_sql;
EXECUTE notification_settings_add_fk_stmt;
DEALLOCATE PREPARE notification_settings_add_fk_stmt;
