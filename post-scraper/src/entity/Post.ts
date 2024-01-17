import { Collection, Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class Post {
    @PrimaryGeneratedColumn()
    id: number
    
    @Column()
    title: string

    @Column()
    guid: string
    
    @Column()
    author: string

    @Column({ type: 'timestamptz' })
    date: Date

    @Column()
    link: string
    
    @Column()
    content: string

    @Column({ type: 'jsonb', nullable: true })
    categories: Array<string>

    @Column({})
    embeddings: string
}
