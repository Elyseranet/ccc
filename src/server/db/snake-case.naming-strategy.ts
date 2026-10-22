import { DefaultNamingStrategy } from 'typeorm'

const toSnakeCase = (value: string): string => value
  .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
  .replace(/[\s.-]+/g, '_')
  .toLowerCase()

export class SnakeNamingStrategy extends DefaultNamingStrategy {
  override tableName(className: string, userSpecifiedName: string | undefined): string {
    return toSnakeCase(userSpecifiedName ?? className)
  }

  override columnName(propertyName: string, customName: string, embeddedPrefixes: string[]): string {
    return toSnakeCase([...embeddedPrefixes, customName || propertyName].join('_'))
  }

  override relationName(propertyName: string): string {
    return toSnakeCase(propertyName)
  }

  override joinColumnName(relationName: string, referencedColumnName: string): string {
    return toSnakeCase(`${relationName}_${referencedColumnName}`)
  }

  override joinTableName(
    firstTableName: string,
    secondTableName: string,
    firstPropertyName: string,
    _secondPropertyName: string
  ): string {
    return toSnakeCase(`${firstTableName}_${firstPropertyName.replace('.', '_')}_${secondTableName}`)
  }

  override joinTableColumnName(tableName: string, propertyName: string, columnName?: string): string {
    return toSnakeCase(`${tableName}_${columnName ?? propertyName}`)
  }

  override joinTableColumnDuplicationPrefix(columnName: string, index: number): string {
    return `${toSnakeCase(columnName)}_${index}`
  }

  override joinTableInverseColumnName(tableName: string, propertyName: string, columnName?: string): string {
    return this.joinTableColumnName(tableName, propertyName, columnName)
  }

  override closureJunctionTableName(originalClosureTableName: string): string {
    return toSnakeCase(super.closureJunctionTableName(originalClosureTableName))
  }

  override primaryKeyName(tableOrName: Parameters<DefaultNamingStrategy['primaryKeyName']>[0], columnNames: string[]): string {
    return toSnakeCase(super.primaryKeyName(tableOrName, columnNames))
  }

  override uniqueConstraintName(tableOrName: Parameters<DefaultNamingStrategy['uniqueConstraintName']>[0], columnNames: string[]): string {
    return toSnakeCase(super.uniqueConstraintName(tableOrName, columnNames))
  }

  override relationConstraintName(tableOrName: Parameters<DefaultNamingStrategy['relationConstraintName']>[0], columnNames: string[], where?: string): string {
    return toSnakeCase(super.relationConstraintName(tableOrName, columnNames, where))
  }

  override defaultConstraintName(tableOrName: Parameters<DefaultNamingStrategy['defaultConstraintName']>[0], columnName: string): string {
    return toSnakeCase(super.defaultConstraintName(tableOrName, columnName))
  }

  override foreignKeyName(
    tableOrName: Parameters<DefaultNamingStrategy['foreignKeyName']>[0],
    columnNames: string[],
    referencedTablePath?: string,
    referencedColumnNames?: string[]
  ): string {
    return toSnakeCase(super.foreignKeyName(tableOrName, columnNames, referencedTablePath, referencedColumnNames))
  }

  override indexName(tableOrName: Parameters<DefaultNamingStrategy['indexName']>[0], columnNames: string[], where?: string): string {
    return toSnakeCase(super.indexName(tableOrName, columnNames, where))
  }

  override checkConstraintName(
    tableOrName: Parameters<DefaultNamingStrategy['checkConstraintName']>[0],
    expression: string,
    isEnum?: boolean
  ): string {
    return toSnakeCase(super.checkConstraintName(tableOrName, expression, isEnum))
  }

  override exclusionConstraintName(
    tableOrName: Parameters<DefaultNamingStrategy['exclusionConstraintName']>[0],
    expression: string
  ): string {
    return toSnakeCase(super.exclusionConstraintName(tableOrName, expression))
  }
}
